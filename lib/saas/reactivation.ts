import { prisma } from "@/lib/prisma";
import { syncClientEntitlements } from "./access-sync";
import { syncRuntimeSubscription } from "./runtime-subscription-sync";

export class SaaSReactivationError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "SAAS_REACTIVATION_ERROR",
  ) {
    super(message);
    this.name = "SaaSReactivationError";
  }
}

type FailureState = {
  lastInvoiceId: string | null;
  suspendedAt: Date | null;
};

type StripeSubscription = {
  id: string;
  status: string;
  cancel_at_period_end?: boolean;
};

type StripeInvoice = {
  id: string;
  status?: string | null;
  paid?: boolean;
};

function stripeKey(environment: "TEST" | "LIVE") {
  const key =
    environment === "LIVE"
      ? process.env.STRIPE_SECRET_KEY?.trim()
      : process.env.STRIPE_TEST_SECRET_KEY?.trim();

  if (!key) {
    throw new SaaSReactivationError(
      "Stripe secret key is not configured.",
      500,
      "STRIPE_SECRET_NOT_CONFIGURED",
    );
  }

  return key;
}

async function stripeGet<T>(environment: "TEST" | "LIVE", path: string) {
  const response = await fetch(`https://api.stripe.com${path}`, {
    headers: { Authorization: `Bearer ${stripeKey(environment)}` },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new SaaSReactivationError(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
      response.status >= 400 && response.status < 500 ? 409 : 502,
      "STRIPE_REACTIVATION_CHECK_FAILED",
    );
  }

  return data;
}

async function failureState(billingSubscriptionId: string) {
  const rows = await prisma.$queryRaw<FailureState[]>`
    SELECT "lastInvoiceId", "suspendedAt"
    FROM "SaasPaymentFailureState"
    WHERE "billingSubscriptionId" = ${billingSubscriptionId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function isSaaSSubscriptionPaymentSuspended(
  stripeSubscriptionId: string,
) {
  const rows = await prisma.$queryRaw<Array<{ suspendedAt: Date | null }>>`
    SELECT f."suspendedAt"
    FROM "SaasPaymentFailureState" f
    JOIN "BillingSubscription" b ON b."id" = f."billingSubscriptionId"
    WHERE b."stripeSubscriptionId" = ${stripeSubscriptionId}
    LIMIT 1
  `;
  return Boolean(rows[0]?.suspendedAt);
}

export async function reactivateSaaSSubscription(input: {
  stripeSubscriptionId: string;
  expectedInvoiceId?: string | null;
}) {
  const subscription = await prisma.billingSubscription.findUnique({
    where: { stripeSubscriptionId: input.stripeSubscriptionId },
    select: {
      id: true,
      clientId: true,
      environment: true,
      stripeSubscriptionId: true,
    },
  });

  if (!subscription) {
    throw new SaaSReactivationError(
      "Billing subscription not found.",
      404,
      "SUBSCRIPTION_NOT_FOUND",
    );
  }

  const failure = await failureState(subscription.id);
  if (!failure?.suspendedAt) {
    throw new SaaSReactivationError(
      "Subscription is not suspended for a failed payment.",
      409,
      "SUBSCRIPTION_NOT_PAYMENT_SUSPENDED",
    );
  }
  if (!failure.lastInvoiceId) {
    throw new SaaSReactivationError(
      "Suspended payment failure has no invoice reference.",
      409,
      "REACTIVATION_INVOICE_MISSING",
    );
  }
  if (
    input.expectedInvoiceId &&
    input.expectedInvoiceId !== failure.lastInvoiceId
  ) {
    throw new SaaSReactivationError(
      "Paid invoice does not match the suspended payment failure.",
      409,
      "REACTIVATION_INVOICE_MISMATCH",
    );
  }

  const stripeSubscription = await stripeGet<StripeSubscription>(
    subscription.environment,
    `/v1/subscriptions/${encodeURIComponent(subscription.stripeSubscriptionId)}`,
  );
  if (stripeSubscription.status !== "active") {
    throw new SaaSReactivationError(
      `Stripe subscription is ${stripeSubscription.status}; payment recovery is incomplete.`,
      409,
      "STRIPE_SUBSCRIPTION_NOT_ACTIVE",
    );
  }

  const invoice = await stripeGet<StripeInvoice>(
    subscription.environment,
    `/v1/invoices/${encodeURIComponent(failure.lastInvoiceId)}`,
  );
  if (invoice.status !== "paid" && invoice.paid !== true) {
    throw new SaaSReactivationError(
      `Stripe invoice ${invoice.id} is not paid.`,
      409,
      "STRIPE_INVOICE_NOT_PAID",
    );
  }

  const targetStatus = stripeSubscription.cancel_at_period_end
    ? "CANCELING"
    : "ACTIVE";

  await prisma.$transaction(async (tx) => {
    const lockKey = `saas-reactivation:${subscription.id}`;
    await tx.$queryRaw<Array<{ acquired: number }>>`
      SELECT 1::int AS acquired
      FROM pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `;

    await tx.billingSubscription.update({
      where: { id: subscription.id },
      data: {
        status: targetStatus,
        cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
      },
    });
    await tx.$executeRaw`
      DELETE FROM "SaasPaymentFailureState"
      WHERE "billingSubscriptionId" = ${subscription.id}
    `;
  });

  await syncClientEntitlements(subscription.clientId);
  await syncRuntimeSubscription(subscription.stripeSubscriptionId);

  return {
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    environment: subscription.environment,
    status: targetStatus,
    cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
    paidInvoiceId: invoice.id,
    reactivated: true,
  } as const;
}
