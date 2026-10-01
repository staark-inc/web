import crypto from "node:crypto";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { getBillingPriceByLookupKey } from "./billing";
import { resolveEntitlements } from "./entitlements";
import {
  toDbBillingEnvironment,
  toDbBillingInterval,
  type BillingSubscriptionStatusValue,
} from "./subscriptions";

export type StripeWebhookEnvironment = "test" | "live";

export type StripeWebhookEvent = {
  id: string;
  type: string;
  livemode?: boolean;
  data?: { object?: Record<string, unknown> };
};

type StripeCustomer = {
  id: string;
  email?: string | null;
  name?: string | null;
  deleted?: boolean;
};

type StripePrice = {
  id: string;
  product?: string | { id?: string } | null;
  lookup_key?: string | null;
  currency?: string | null;
  unit_amount?: number | null;
  tax_behavior?: string | null;
  recurring?: { interval?: string | null } | null;
};

type StripeSubscriptionItem = {
  current_period_start?: number | null;
  current_period_end?: number | null;
  price?: StripePrice | null;
};

type StripeSubscription = {
  id: string;
  customer: string | StripeCustomer;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_start?: number | null;
  current_period_end?: number | null;
  trial_start?: number | null;
  trial_end?: number | null;
  canceled_at?: number | null;
  ended_at?: number | null;
  metadata?: Record<string, string> | null;
  items?: { data?: StripeSubscriptionItem[] } | null;
};

const ACCESS_STATUSES: BillingSubscriptionStatusValue[] = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELING",
];

function getStripeSecretKey(environment: StripeWebhookEnvironment): string {
  const secret =
    environment === "live"
      ? process.env.STRIPE_SECRET_KEY?.trim()
      : process.env.STRIPE_TEST_SECRET_KEY?.trim();

  if (!secret) {
    throw new Error(
      environment === "live"
        ? "STRIPE_SECRET_KEY is not configured."
        : "STRIPE_TEST_SECRET_KEY is not configured.",
    );
  }

  return secret;
}

async function stripeGet<T>(
  environment: StripeWebhookEnvironment,
  path: string,
): Promise<T> {
  const response = await fetch(`https://api.stripe.com${path}`, {
    headers: {
      Authorization: `Bearer ${getStripeSecretKey(environment)}`,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new Error(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
    );
  }

  return data;
}

function objectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : null;
  }
  return null;
}

function unixDate(value: number | null | undefined): Date | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;
}

function extractSubscriptionId(
  eventType: string,
  object: Record<string, unknown> | undefined,
): string | null {
  if (!object) return null;

  if (eventType.startsWith("customer.subscription.")) {
    return objectId(object);
  }

  const direct = objectId(object.subscription);
  if (direct) return direct;

  const parent = object.parent;
  if (parent && typeof parent === "object") {
    const details = (parent as Record<string, unknown>).subscription_details;
    if (details && typeof details === "object") {
      const nested = objectId(
        (details as Record<string, unknown>).subscription,
      );
      if (nested) return nested;
    }
  }

  return null;
}

function mapStripeStatus(
  status: string,
  cancelAtPeriodEnd: boolean,
): BillingSubscriptionStatusValue {
  if (cancelAtPeriodEnd && (status === "trialing" || status === "active")) {
    return "CANCELING";
  }

  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "unpaid":
      return "UNPAID";
    case "paused":
      return "PAUSED";
    default:
      throw new Error(`Unsupported Stripe subscription status: ${status}.`);
  }
}

async function getCustomer(
  environment: StripeWebhookEnvironment,
  value: string | StripeCustomer,
): Promise<StripeCustomer> {
  if (typeof value !== "string") return value;
  return stripeGet<StripeCustomer>(environment, `/v1/customers/${value}`);
}

async function getOrCreateBillingCustomer(
  environment: StripeWebhookEnvironment,
  customer: StripeCustomer,
) {
  if (customer.deleted) {
    throw new Error(`Stripe Customer ${customer.id} is deleted.`);
  }

  const dbEnvironment = toDbBillingEnvironment(environment);
  const existing = await prisma.billingCustomer.findUnique({
    where: { stripeCustomerId: customer.id },
  });

  if (existing) {
    if (existing.environment !== dbEnvironment) {
      throw new Error(
        `Stripe Customer ${customer.id} is already linked to ${existing.environment}.`,
      );
    }
    return existing;
  }

  const email = customer.email?.trim() || null;
  let client = null;

  if (email) {
    const candidates = await prisma.client.findMany({
      where: {
        billingEmail: email,
        billingCustomers: {
          none: { environment: dbEnvironment },
        },
      },
      take: 2,
      orderBy: { createdAt: "asc" },
    });

    if (candidates.length === 1) client = candidates[0];
  }

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: customer.name?.trim() || email || `Stripe ${customer.id}`,
        billingEmail: email,
      },
    });
  }

  return prisma.billingCustomer.create({
    data: {
      clientId: client.id,
      environment: dbEnvironment,
      stripeCustomerId: customer.id,
    },
  });
}

async function syncClientEntitlements(clientId: string) {
  const subscriptions = await prisma.billingSubscription.findMany({
    where: {
      clientId,
      status: { in: ACCESS_STATUSES },
    },
    orderBy: { updatedAt: "desc" },
  });

  const live = subscriptions.find(
    (subscription) => subscription.environment === "LIVE",
  );
  const selected = live ?? subscriptions[0] ?? null;

  if (!selected) {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        saasPlanCode: null,
        saasEntitlements: {},
      },
    });
    return;
  }

  if (selected.entitlements === null) {
    throw new Error(
      `Billing subscription ${selected.id} has a null entitlement snapshot.`,
    );
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      saasPlanCode: selected.planCode,
      saasEntitlements: selected.entitlements as Prisma.InputJsonValue,
    },
  });
}

export async function syncStripeSubscription(
  environment: StripeWebhookEnvironment,
  subscription: StripeSubscription,
) {
  const items = subscription.items?.data ?? [];
  if (items.length !== 1) {
    throw new Error(
      `Stripe Subscription ${subscription.id} must contain exactly one priced item.`,
    );
  }

  const item = items[0];
  const stripePrice = item?.price;

  if (!item || !stripePrice) {
    throw new Error(
      `Stripe Subscription ${subscription.id} must contain exactly one priced item.`,
    );
  }

  const lookupKey =
    stripePrice.lookup_key ?? subscription.metadata?.staark_lookup_key ?? null;

  if (!lookupKey) {
    throw new Error(
      `Stripe Subscription ${subscription.id} has no Staark price lookup key.`,
    );
  }

  const canonical = getBillingPriceByLookupKey(lookupKey);
  if (!canonical) {
    throw new Error(`Unknown Staark Stripe Price lookup key: ${lookupKey}.`);
  }

  if (stripePrice.currency !== canonical.currency) {
    throw new Error(`Stripe currency mismatch for ${lookupKey}.`);
  }
  if (stripePrice.unit_amount !== canonical.unitAmountOre) {
    throw new Error(`Stripe amount mismatch for ${lookupKey}.`);
  }
  if (stripePrice.recurring?.interval !== canonical.interval) {
    throw new Error(`Stripe interval mismatch for ${lookupKey}.`);
  }
  if (stripePrice.tax_behavior !== canonical.taxBehavior) {
    throw new Error(`Stripe tax behavior mismatch for ${lookupKey}.`);
  }

  const customer = await getCustomer(environment, subscription.customer);
  const billingCustomer = await getOrCreateBillingCustomer(environment, customer);
  const entitlements = resolveEntitlements(canonical.planCode);
  const cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);
  const status = mapStripeStatus(subscription.status, cancelAtPeriodEnd);
  const productId = objectId(stripePrice.product);

  const data = {
    clientId: billingCustomer.clientId,
    billingCustomerId: billingCustomer.id,
    environment: toDbBillingEnvironment(environment),
    stripePriceId: stripePrice.id,
    stripeProductId: productId,
    planCode: canonical.planCode,
    interval: toDbBillingInterval(canonical.interval),
    currency: canonical.currency,
    unitAmountOre: canonical.unitAmountOre,
    taxBehavior: canonical.taxBehavior,
    status,
    cancelAtPeriodEnd,
    currentPeriodStart: unixDate(
      item.current_period_start ?? subscription.current_period_start,
    ),
    currentPeriodEnd: unixDate(
      item.current_period_end ?? subscription.current_period_end,
    ),
    trialStart: unixDate(subscription.trial_start),
    trialEnd: unixDate(subscription.trial_end),
    canceledAt: unixDate(subscription.canceled_at),
    endedAt: unixDate(subscription.ended_at),
    entitlements,
  } as const;

  const saved = await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      stripeSubscriptionId: subscription.id,
      ...data,
    },
    update: data,
  });

  await syncClientEntitlements(billingCustomer.clientId);
  return saved;
}

async function eventAlreadyProcessed(
  environment: StripeWebhookEnvironment,
  eventId: string,
): Promise<boolean> {
  const dbEnvironment = toDbBillingEnvironment(environment);
  const rows = await prisma.$queryRaw<Array<{ processedAt: Date | null }>>`
    SELECT "processedAt"
    FROM "BillingWebhookEvent"
    WHERE "stripeEventId" = ${eventId}
      AND "environment" = ${dbEnvironment}::"BillingEnvironment"
    LIMIT 1
  `;
  return Boolean(rows[0]?.processedAt);
}

async function markEventProcessed(
  environment: StripeWebhookEnvironment,
  event: StripeWebhookEvent,
) {
  const dbEnvironment = toDbBillingEnvironment(environment);
  await prisma.$executeRaw`
    INSERT INTO "BillingWebhookEvent" (
      "id", "environment", "stripeEventId", "type", "processedAt", "createdAt", "updatedAt"
    ) VALUES (
      ${crypto.randomUUID()}, ${dbEnvironment}::"BillingEnvironment", ${event.id}, ${event.type}, NOW(), NOW(), NOW()
    )
    ON CONFLICT ("environment", "stripeEventId") DO UPDATE SET
      "processedAt" = EXCLUDED."processedAt",
      "type" = EXCLUDED."type",
      "updatedAt" = NOW()
  `;
}

export async function processStripeWebhookEvent(
  environment: StripeWebhookEnvironment,
  event: StripeWebhookEvent,
) {
  if (!event.id || !event.type) {
    throw new Error("Stripe webhook event is missing id or type.");
  }

  if (await eventAlreadyProcessed(environment, event.id)) {
    return { duplicate: true, synced: false };
  }

  const object = event.data?.object;
  const subscriptionId = extractSubscriptionId(event.type, object);
  let synced = false;

  if (subscriptionId) {
    let subscription: StripeSubscription;

    try {
      subscription = await stripeGet<StripeSubscription>(
        environment,
        `/v1/subscriptions/${subscriptionId}`,
      );
    } catch (error) {
      if (
        event.type === "customer.subscription.deleted" &&
        object &&
        objectId(object) === subscriptionId
      ) {
        subscription = object as unknown as StripeSubscription;
      } else {
        throw error;
      }
    }

    await syncStripeSubscription(environment, subscription);
    synced = true;
  }

  await markEventProcessed(environment, event);
  return { duplicate: false, synced };
}
