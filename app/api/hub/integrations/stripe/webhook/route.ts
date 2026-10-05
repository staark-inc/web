import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

import { afterStripePaymentWebhook } from "@/lib/saas/payment-failures";
import { afterStripeReactivationWebhook } from "@/lib/saas/reactivation-webhook";
import {
  processStripeWebhookEvent,
  type StripeWebhookEnvironment,
  type StripeWebhookEvent,
} from "@/lib/saas/stripe-webhooks";

export const runtime = "nodejs";

const SIGNATURE_TOLERANCE_SECONDS = 300;

function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestampPart || signatures.length === 0) return false;

  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isFinite(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(signature, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

function getVerifiedEnvironment(
  payload: string,
  signature: string,
): StripeWebhookEnvironment | null {
  const liveSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const testSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET?.trim();

  if (liveSecret && verifyStripeSignature(payload, signature, liveSecret)) {
    return "live";
  }

  if (testSecret && verifyStripeSignature(payload, signature, testSecret)) {
    return "test";
  }

  return null;
}

export async function POST(request: Request) {
  const liveWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const testWebhookSecret = process.env.STRIPE_TEST_WEBHOOK_SECRET?.trim();

  if (!liveWebhookSecret && !testWebhookSecret) {
    console.error("[STRIPE] No webhook secret is configured.");
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  const environment = getVerifiedEnvironment(rawBody, signature);

  if (!environment) {
    console.error("[STRIPE] Invalid webhook signature.");
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  if (typeof event.livemode === "boolean") {
    const payloadEnvironment: StripeWebhookEnvironment = event.livemode
      ? "live"
      : "test";

    if (payloadEnvironment !== environment) {
      console.error("[STRIPE] Webhook environment mismatch.");
      return NextResponse.json(
        { error: "Webhook environment mismatch." },
        { status: 400 },
      );
    }
  }

  try {
    const result = await processStripeWebhookEvent(environment, event);

    if (!result.duplicate) {
      await afterStripePaymentWebhook(environment, event);
      await afterStripeReactivationWebhook(environment, event);

      if (
        event.type === "customer.subscription.deleted" ||
        event.type === "customer.subscription.updated"
      ) {
        const object = event.data?.object;
        const stripeSubscriptionId =
          object && typeof object.id === "string"
            ? object.id
            : null;

        if (stripeSubscriptionId) {
          const subscription = await prisma.billingSubscription.findUnique({
            where: { stripeSubscriptionId },
            select: {
              id: true,
              status: true,
              client: {
                select: {
                  name: true,
                },
              },
            },
          });

          if (
            subscription &&
            (
              subscription.status === "CANCELED" ||
              subscription.status === "UNPAID" ||
              subscription.status === "INCOMPLETE" ||
              subscription.status === "INCOMPLETE_EXPIRED"
            )
          ) {
            await createAdminNotification({
              type: "billing.subscription_problem",
              title:
                subscription.status === "CANCELED"
                  ? "SaaS subscription canceled"
                  : "SaaS subscription needs attention",
              message: `${subscription.client.name} is now ${subscription.status.toLowerCase().replaceAll("_", " ")} in Stripe.`,
              href: `/hub/saas/subscriptions/${subscription.id}`,
              preference: "billing",
              metadata: {
                billingSubscriptionId: subscription.id,
                stripeSubscriptionId,
                status: subscription.status,
                environment,
                stripeEventId: event.id,
              },
              dedupeKey: `stripe:${environment}:subscription:${event.id}`,
            });
          }
        }
      }
    }

    console.log(
      `[STRIPE:${environment.toUpperCase()}] ${event.type} (${event.id}) synced=${result.synced} duplicate=${result.duplicate}`,
    );

    return NextResponse.json({
      received: true,
      environment,
      ...result,
    });
  } catch (error) {
    console.error(
      `[STRIPE:${environment.toUpperCase()}] Failed ${event.type} (${event.id}):`,
      error,
    );

    try {
      await createAdminNotification({
        type: "billing.webhook_failed",
        title: "Stripe webhook processing failed",
        message:
          error instanceof Error
            ? `${event.type}: ${error.message}`
            : `Stripe event ${event.type} could not be processed.`,
        href: "/hub/saas",
        preference: "billing",
        metadata: {
          stripeEventId: event.id,
          eventType: event.type,
          environment,
        },
        dedupeKey: `stripe:${environment}:webhook-error:${event.id}`,
      });
    } catch (notificationError) {
      console.error("[STRIPE] Could not create webhook failure notification:", notificationError);
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process Stripe webhook.",
      },
      { status: 500 },
    );
  }
}
