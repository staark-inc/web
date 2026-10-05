import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/notifications";

import { syncClientEntitlements } from "./access-sync";
import { syncRuntimeSubscription } from "./runtime-subscription-sync";
import {
  hasServiceAccess,
  toDbBillingEnvironment,
  type BillingSubscriptionStatusValue,
} from "./subscriptions";
import type {
  StripeWebhookEnvironment,
  StripeWebhookEvent,
} from "./stripe-webhooks";

export const SAAS_PAYMENT_GRACE_DAYS = 7 as const;

function objectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : null;
  }
  return null;
}

function extractSubscriptionId(
  eventType: string,
  object: Record<string, unknown> | undefined,
): string | null {
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

function extractInvoiceId(object: Record<string, unknown> | undefined): string | null {
  return objectId(object);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

type FailureStateRow = {
  billingSubscriptionId: string;
  suspendedAt: Date | null;
};

export async function afterStripePaymentWebhook(
  environment: StripeWebhookEnvironment,
  event: StripeWebhookEvent,
) {
  if (
    event.type !== "invoice.payment_failed" &&
    event.type !== "invoice.paid"
  ) {
    return;
  }

  const object = event.data?.object;
  const stripeSubscriptionId = extractSubscriptionId(event.type, object);
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.billingSubscription.findUnique({
    where: { stripeSubscriptionId },
    select: {
      id: true,
      clientId: true,
      environment: true,
      status: true,
      client: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!subscription) return;
  if (subscription.environment !== toDbBillingEnvironment(environment)) return;

  if (event.type === "invoice.payment_failed") {
    if (subscription.status !== "PAST_DUE") return;

    const now = new Date();
    const graceEndsAt = addDays(now, SAAS_PAYMENT_GRACE_DAYS);
    const invoiceId = extractInvoiceId(object);

    await prisma.$executeRaw`
      INSERT INTO "SaasPaymentFailureState" (
        "id",
        "billingSubscriptionId",
        "firstFailedAt",
        "lastFailedAt",
        "graceEndsAt",
        "lastInvoiceId",
        "suspendedAt",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${crypto.randomUUID()},
        ${subscription.id},
        ${now},
        ${now},
        ${graceEndsAt},
        ${invoiceId},
        NULL,
        NOW(),
        NOW()
      )
      ON CONFLICT ("billingSubscriptionId") DO UPDATE SET
        "lastFailedAt" = EXCLUDED."lastFailedAt",
        "lastInvoiceId" = EXCLUDED."lastInvoiceId",
        "updatedAt" = NOW()
    `;

    await createAdminNotification({
      type: "billing.payment_failed",
      title: "SaaS payment failed",
      message: `${subscription.client.name} has a failed Stripe payment. Grace period ends in ${SAAS_PAYMENT_GRACE_DAYS} days.`,
      href: `/hub/saas/subscriptions/${subscription.id}`,
      preference: "billing",
      metadata: {
        billingSubscriptionId: subscription.id,
        stripeSubscriptionId,
        environment,
        invoiceId,
        graceEndsAt: graceEndsAt.toISOString(),
      },
      dedupeKey: `stripe:${environment}:payment-failed:${event.id}`,
    });

    return;
  }

  const states = await prisma.$queryRaw<FailureStateRow[]>`
    SELECT "billingSubscriptionId", "suspendedAt"
    FROM "SaasPaymentFailureState"
    WHERE "billingSubscriptionId" = ${subscription.id}
    LIMIT 1
  `;

  const state = states[0];
  if (!state) return;

  if (state.suspendedAt) {
    // A paid invoice after suspension must be handled by the
    // dedicated reactivation flow. Never write SUSPENDED again here.
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM "SaasPaymentFailureState"
    WHERE "billingSubscriptionId" = ${subscription.id}
  `;

  await syncClientEntitlements(subscription.clientId);
  await syncRuntimeSubscription(stripeSubscriptionId);
}

type DueSuspensionRow = {
  billingSubscriptionId: string;
  stripeSubscriptionId: string;
  clientId: string;
  environment: "TEST" | "LIVE";
  graceEndsAt: Date;
};

type StripeSubscription = {
  id: string;
  status: string;
};

function getStripeSecretKey(environment: "TEST" | "LIVE"): string {
  const value =
    environment === "LIVE"
      ? process.env.STRIPE_SECRET_KEY?.trim()
      : process.env.STRIPE_TEST_SECRET_KEY?.trim();

  if (!value) {
    throw new Error(
      environment === "LIVE"
        ? "STRIPE_SECRET_KEY is not configured."
        : "STRIPE_TEST_SECRET_KEY is not configured.",
    );
  }

  return value;
}

async function getStripeSubscription(
  environment: "TEST" | "LIVE",
  stripeSubscriptionId: string,
): Promise<StripeSubscription> {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(stripeSubscriptionId)}`,
    {
      headers: {
        Authorization: `Bearer ${getStripeSecretKey(environment)}`,
      },
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => null)) as
    | (StripeSubscription & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new Error(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
    );
  }

  return data;
}

export async function processDueSaaSSuspensions(now = new Date()) {
  const due = await prisma.$queryRaw<DueSuspensionRow[]>`
    SELECT
      f."billingSubscriptionId",
      b."stripeSubscriptionId",
      b."clientId",
      b."environment",
      f."graceEndsAt"
    FROM "SaasPaymentFailureState" f
    JOIN "BillingSubscription" b
      ON b."id" = f."billingSubscriptionId"
    WHERE f."suspendedAt" IS NULL
      AND f."graceEndsAt" <= ${now}
      AND b."status" = 'PAST_DUE'::"BillingSubscriptionStatus"
    ORDER BY f."graceEndsAt" ASC
  `;

  const results: Array<{
    stripeSubscriptionId: string;
    status: "SUSPENDED" | "SKIPPED";
    reason?: string;
  }> = [];

  for (const candidate of due) {
    const stripe = await getStripeSubscription(
      candidate.environment,
      candidate.stripeSubscriptionId,
    );

    if (stripe.status !== "past_due") {
      results.push({
        stripeSubscriptionId: candidate.stripeSubscriptionId,
        status: "SKIPPED",
        reason: `Stripe status is ${stripe.status}.`,
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const lockKey = `saas-payment-suspension:${candidate.billingSubscriptionId}`;
      await tx.$queryRaw<Array<{ acquired: number }>>`
        SELECT 1::int AS acquired
        FROM pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
      `;

      const current = await tx.billingSubscription.findUnique({
        where: { id: candidate.billingSubscriptionId },
        select: { status: true, clientId: true },
      });

      if (!current || current.status !== "PAST_DUE") return;

      await tx.billingSubscription.update({
        where: { id: candidate.billingSubscriptionId },
        data: { status: "SUSPENDED" },
      });

      await tx.$executeRaw`
        UPDATE "SaasPaymentFailureState"
        SET "suspendedAt" = NOW(), "updatedAt" = NOW()
        WHERE "billingSubscriptionId" = ${candidate.billingSubscriptionId}
          AND "suspendedAt" IS NULL
      `;
    });

    await syncClientEntitlements(candidate.clientId);
    await syncRuntimeSubscription(candidate.stripeSubscriptionId);

    const suspendedSubscription = await prisma.billingSubscription.findUnique({
      where: { id: candidate.billingSubscriptionId },
      select: {
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    await createAdminNotification({
      type: "billing.subscription_suspended",
      title: "SaaS subscription suspended",
      message: `${suspendedSubscription?.client.name ?? "A SaaS customer"} was suspended after the payment grace period expired.`,
      href: `/hub/saas/subscriptions/${candidate.billingSubscriptionId}`,
      preference: "billing",
      metadata: {
        billingSubscriptionId: candidate.billingSubscriptionId,
        stripeSubscriptionId: candidate.stripeSubscriptionId,
        environment: candidate.environment,
        graceEndsAt: candidate.graceEndsAt.toISOString(),
      },
      dedupeKey: `saas:suspended:${candidate.billingSubscriptionId}:${candidate.graceEndsAt.toISOString()}`,
    });

    results.push({
      stripeSubscriptionId: candidate.stripeSubscriptionId,
      status: "SUSPENDED",
    });
  }

  return {
    checkedAt: now.toISOString(),
    processed: results.length,
    suspended: results.filter((item) => item.status === "SUSPENDED").length,
    results,
  };
}

export function hasBillingAccessStatus(
  status: BillingSubscriptionStatusValue,
) {
  return hasServiceAccess(status);
}
