import { prisma } from "@/lib/prisma";

import type { SaaSCheckoutEnvironment } from "./stripe-checkout";

export type SaaSSubscriptionLifecycleAction = "CANCEL" | "RESUME";

export class SaaSSubscriptionLifecycleError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "SAAS_SUBSCRIPTION_LIFECYCLE_ERROR",
  ) {
    super(message);
    this.name = "SaaSSubscriptionLifecycleError";
  }
}

type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number | null;
  items?: {
    data?: Array<{
      current_period_end?: number | null;
    }>;
  } | null;
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
    throw new SaaSSubscriptionLifecycleError(
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
    throw new SaaSSubscriptionLifecycleError(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
      response.status >= 400 && response.status < 500 ? 409 : 502,
      "STRIPE_SUBSCRIPTION_UPDATE_FAILED",
    );
  }

  return data;
}

function unixDate(value: number | null | undefined): Date | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000)
    : null;
}

function stripePeriodEnd(subscription: StripeSubscription): Date | null {
  const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  return unixDate(itemPeriodEnd ?? subscription.current_period_end);
}

export async function updateSaaSSubscriptionLifecycle(input: {
  stripeSubscriptionId: string;
  action: SaaSSubscriptionLifecycleAction;
}) {
  const subscription = await prisma.billingSubscription.findUnique({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    select: {
      id: true,
      stripeSubscriptionId: true,
      environment: true,
      status: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!subscription) {
    throw new SaaSSubscriptionLifecycleError(
      "Billing subscription not found.",
      404,
      "SUBSCRIPTION_NOT_FOUND",
    );
  }

  if (input.action === "CANCEL") {
    if (!(["TRIALING", "ACTIVE"] as const).includes(subscription.status as "TRIALING" | "ACTIVE")) {
      throw new SaaSSubscriptionLifecycleError(
        `Subscription status ${subscription.status} cannot be scheduled for cancellation in SaaS-08.`,
        409,
        "SUBSCRIPTION_NOT_CANCELABLE",
      );
    }

    if (subscription.cancelAtPeriodEnd) {
      throw new SaaSSubscriptionLifecycleError(
        "Subscription is already scheduled for cancellation.",
        409,
        "SUBSCRIPTION_ALREADY_CANCELING",
      );
    }
  } else {
    if (subscription.status !== "CANCELING" || !subscription.cancelAtPeriodEnd) {
      throw new SaaSSubscriptionLifecycleError(
        "Subscription is not scheduled for cancellation.",
        409,
        "SUBSCRIPTION_NOT_CANCELING",
      );
    }
  }

  const environment = toStripeEnvironment(subscription.environment);
  const stripeSubscription = await stripeRequest<StripeSubscription>(
    environment,
    `/v1/subscriptions/${encodeURIComponent(subscription.stripeSubscriptionId)}`,
  );

  if (!["trialing", "active"].includes(stripeSubscription.status)) {
    throw new SaaSSubscriptionLifecycleError(
      `Stripe subscription status ${stripeSubscription.status} cannot be changed by SaaS-08.`,
      409,
      "STRIPE_SUBSCRIPTION_NOT_CHANGEABLE",
    );
  }

  const stripeCancelAtPeriodEnd = Boolean(stripeSubscription.cancel_at_period_end);
  const expectedBefore = input.action === "RESUME";

  if (stripeCancelAtPeriodEnd !== expectedBefore) {
    throw new SaaSSubscriptionLifecycleError(
      "Stripe and local billing snapshots are out of sync. Wait for webhook synchronization before retrying.",
      409,
      "BILLING_SNAPSHOT_OUT_OF_SYNC",
    );
  }

  const body = new URLSearchParams();
  body.set(
    "cancel_at_period_end",
    input.action === "CANCEL" ? "true" : "false",
  );
  body.set(
    "metadata[staark_subscription_action]",
    input.action.toLowerCase(),
  );

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

  const cancelAtPeriodEnd = Boolean(updated.cancel_at_period_end);
  if (cancelAtPeriodEnd !== (input.action === "CANCEL")) {
    throw new SaaSSubscriptionLifecycleError(
      "Stripe returned an unexpected cancel_at_period_end state.",
      502,
      "STRIPE_UNEXPECTED_LIFECYCLE_STATE",
    );
  }

  const expectedStatus =
    input.action === "CANCEL"
      ? "CANCELING"
      : updated.status === "trialing"
        ? "TRIALING"
        : "ACTIVE";

  return {
    stripeSubscriptionId: updated.id,
    environment: subscription.environment,
    action: input.action,
    cancelAtPeriodEnd,
    expectedStatus,
    currentPeriodEnd: stripePeriodEnd(updated)?.toISOString() ?? null,
  };
}
