import { prisma } from "@/lib/prisma";

import { reactivateSaaSSubscription } from "./reactivation";
import type {
  StripeWebhookEnvironment,
  StripeWebhookEvent,
} from "./stripe-webhooks";

function objectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : null;
  }
  return null;
}

function extractSubscriptionId(object: Record<string, unknown> | undefined) {
  if (!object) return null;

  const direct = objectId(object.subscription);
  if (direct) return direct;

  const parent = object.parent;
  if (parent && typeof parent === "object") {
    const details = (parent as Record<string, unknown>).subscription_details;
    if (details && typeof details === "object") {
      return objectId((details as Record<string, unknown>).subscription);
    }
  }

  return null;
}

export async function afterStripeReactivationWebhook(
  environment: StripeWebhookEnvironment,
  event: StripeWebhookEvent,
) {
  if (event.type !== "invoice.paid") return;

  const object = event.data?.object;
  const stripeSubscriptionId = extractSubscriptionId(object);
  const invoiceId = objectId(object);
  if (!stripeSubscriptionId || !invoiceId) return;

  const rows = await prisma.$queryRaw<Array<{ suspendedAt: Date | null }>>`
    SELECT f."suspendedAt"
    FROM "SaasPaymentFailureState" f
    JOIN "BillingSubscription" b
      ON b."id" = f."billingSubscriptionId"
    WHERE b."stripeSubscriptionId" = ${stripeSubscriptionId}
      AND b."environment" = ${environment === "live" ? "LIVE" : "TEST"}::"BillingEnvironment"
    LIMIT 1
  `;

  if (!rows[0]?.suspendedAt) return;

  await reactivateSaaSSubscription({
    stripeSubscriptionId,
    expectedInvoiceId: invoiceId,
  });
}
