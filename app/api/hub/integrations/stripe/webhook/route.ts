import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SIGNATURE_TOLERANCE_SECONDS = 300;

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestampPart || signatures.length === 0) {
    return false;
  }

  const timestamp = Number(timestampPart.slice(2));
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

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

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    console.error("[STRIPE] STRIPE_WEBHOOK_SECRET is missing.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe-Signature header." }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    console.error("[STRIPE] Invalid webhook signature.");
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: {
    id?: string;
    type?: string;
    livemode?: boolean;
    data?: { object?: Record<string, unknown> };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventType = event.type ?? "unknown";
  const eventId = event.id ?? "unknown";

  switch (eventType) {
    case "checkout.session.completed":
    case "invoice.created":
    case "invoice.finalized":
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.voided":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
      console.log(`[STRIPE] Received ${eventType} (${eventId})`);
      break;
    default:
      console.log(`[STRIPE] Ignored ${eventType} (${eventId})`);
  }

  return NextResponse.json({ received: true });
}
