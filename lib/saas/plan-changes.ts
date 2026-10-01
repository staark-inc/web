import { prisma } from "@/lib/prisma";

import { resolveStripePrice, type SaaSCheckoutEnvironment } from "./stripe-checkout";
import { fromDbBillingInterval } from "./subscriptions";
import type { StaarkPlanCode } from "./plans";

const PLAN_RANK: Record<StaarkPlanCode, number> = {
  STARTER: 0,
  SAAS: 1,
  BUSINESS: 2,
};

const CHANGEABLE_STATUSES = new Set(["TRIALING", "ACTIVE", "PAST_DUE"]);

export type SaaSPlanChangeKind = "UPGRADE" | "DOWNGRADE";

export class SaaSPlanChangeError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "SAAS_PLAN_CHANGE_ERROR",
  ) {
    super(message);
    this.name = "SaaSPlanChangeError";
  }
}

type StripePriceRef = {
  id: string;
  lookup_key?: string | null;
};

type StripeSubscriptionItem = {
  id: string;
  quantity?: number | null;
  price: StripePriceRef;
};

type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  items?: { data?: StripeSubscriptionItem[] } | null;
};

function toStripeEnvironment(environment: "TEST" | "LIVE"): SaaSCheckoutEnvironment {
  return environment === "LIVE" ? "live" : "test";
}

function getStripeSecretKey(environment: SaaSCheckoutEnvironment): string {
  const value =
    environment === "live"
      ? process.env.STRIPE_SECRET_KEY?.trim()
      : process.env.STRIPE_TEST_SECRET_KEY?.trim();

  if (!value) {
    throw new SaaSPlanChangeError(
      environment === "live"
        ? "STRIPE_SECRET_KEY is not configured."
        : "STRIPE_TEST_SECRET_KEY is not configured.",
      500,
      "STRIPE_SECRET_NOT_CONFIGURED",
    );
  }

  return value;
}

async function stripeRequest<T>(
  environment: SaaSCheckoutEnvironment,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${getStripeSecretKey(environment)}`);

  const response = await fetch(`https://api.stripe.com${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new SaaSPlanChangeError(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
      response.status >= 400 && response.status < 500 ? 409 : 502,
      "STRIPE_PLAN_CHANGE_FAILED",
    );
  }

  return data;
}

function classifyPlanChange(
  currentPlanCode: StaarkPlanCode,
  targetPlanCode: StaarkPlanCode,
): SaaSPlanChangeKind {
  return PLAN_RANK[targetPlanCode] > PLAN_RANK[currentPlanCode]
    ? "UPGRADE"
    : "DOWNGRADE";
}

export async function changeSaaSSubscriptionPlan(input: {
  stripeSubscriptionId: string;
  targetPlanCode: StaarkPlanCode;
}) {
  const subscription = await prisma.billingSubscription.findUnique({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    select: {
      id: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      environment: true,
      planCode: true,
      interval: true,
      status: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!subscription) {
    throw new SaaSPlanChangeError(
      "Billing subscription not found.",
      404,
      "SUBSCRIPTION_NOT_FOUND",
    );
  }

  if (!CHANGEABLE_STATUSES.has(subscription.status)) {
    throw new SaaSPlanChangeError(
      `Subscription status ${subscription.status} cannot change plan.`,
      409,
      "SUBSCRIPTION_NOT_CHANGEABLE",
    );
  }

  if (subscription.cancelAtPeriodEnd) {
    throw new SaaSPlanChangeError(
      "Subscription is scheduled for cancellation. Resume it before changing plan.",
      409,
      "SUBSCRIPTION_CANCELING",
    );
  }

  if (subscription.planCode === input.targetPlanCode) {
    throw new SaaSPlanChangeError(
      `Subscription is already on ${input.targetPlanCode}.`,
      409,
      "PLAN_UNCHANGED",
    );
  }

  const environment = toStripeEnvironment(subscription.environment);
  const interval = fromDbBillingInterval(subscription.interval);
  const targetPrice = await resolveStripePrice(
    input.targetPlanCode,
    interval,
    environment,
  );

  const stripeSubscription = await stripeRequest<StripeSubscription>(
    environment,
    `/v1/subscriptions/${encodeURIComponent(subscription.stripeSubscriptionId)}`,
  );

  if (stripeSubscription.cancel_at_period_end) {
    throw new SaaSPlanChangeError(
      "Stripe subscription is scheduled for cancellation. Resume it before changing plan.",
      409,
      "SUBSCRIPTION_CANCELING",
    );
  }

  if (!["trialing", "active", "past_due"].includes(stripeSubscription.status)) {
    throw new SaaSPlanChangeError(
      `Stripe subscription status ${stripeSubscription.status} cannot change plan.`,
      409,
      "STRIPE_SUBSCRIPTION_NOT_CHANGEABLE",
    );
  }

  const items = stripeSubscription.items?.data ?? [];
  if (items.length !== 1) {
    throw new SaaSPlanChangeError(
      `Stripe subscription must contain exactly one priced item; found ${items.length}.`,
      409,
      "INVALID_SUBSCRIPTION_ITEMS",
    );
  }

  const item = items[0];
  if (!item?.id || !item.price?.id) {
    throw new SaaSPlanChangeError(
      "Stripe subscription item is incomplete.",
      409,
      "INVALID_SUBSCRIPTION_ITEM",
    );
  }

  if (item.price.id !== subscription.stripePriceId) {
    throw new SaaSPlanChangeError(
      "Stripe and local billing snapshots are out of sync. Wait for webhook synchronization before retrying.",
      409,
      "BILLING_SNAPSHOT_OUT_OF_SYNC",
    );
  }

  const changeKind = classifyPlanChange(
    subscription.planCode,
    input.targetPlanCode,
  );

  const body = new URLSearchParams();
  body.set("items[0][id]", item.id);
  body.set("items[0][price]", targetPrice.id);
  body.set("items[0][quantity]", "1");
  body.set("proration_behavior", "create_prorations");
  body.set("metadata[staark_plan]", input.targetPlanCode);
  body.set("metadata[staark_interval]", interval);
  body.set("metadata[staark_lookup_key]", targetPrice.lookup_key ?? "");
  body.set("metadata[staark_plan_change]", changeKind.toLowerCase());

  const updated = await stripeRequest<StripeSubscription>(
    environment,
    `/v1/subscriptions/${encodeURIComponent(subscription.stripeSubscriptionId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  return {
    stripeSubscriptionId: updated.id,
    environment: subscription.environment,
    changeKind,
    previousPlanCode: subscription.planCode,
    targetPlanCode: input.targetPlanCode,
    interval,
    targetPriceId: targetPrice.id,
    targetLookupKey: targetPrice.lookup_key,
    prorationBehavior: "create_prorations" as const,
  };
}
