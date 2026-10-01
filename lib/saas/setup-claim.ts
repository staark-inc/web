import crypto from "node:crypto";

import type {
  BillingEnvironment,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { shouldProvisionSubscription } from "./provisioning";
import {
  getSaaSCheckoutEnvironment,
  type SaaSCheckoutEnvironment,
} from "./stripe-checkout";

export const SAAS_SETUP_CLAIM_TTL_MINUTES = 15;
const CLAIM_PREFIX = "stk_claim_";

type StripeCheckoutSession = {
  id: string;
  mode?: string | null;
  status?: string | null;
  customer?: string | { id?: string } | null;
  subscription?: string | { id?: string } | null;
};

function objectId(value: unknown): string | null {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" && id ? id : null;
  }
  return null;
}

function toDbEnvironment(environment: SaaSCheckoutEnvironment): BillingEnvironment {
  return environment === "live" ? "LIVE" : "TEST";
}

function getStripeSecretKey(environment: SaaSCheckoutEnvironment): string {
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

async function retrieveCheckoutSession(
  sessionId: string,
  environment: SaaSCheckoutEnvironment,
): Promise<StripeCheckoutSession> {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${getStripeSecretKey(environment)}`,
      },
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => null)) as
    | (StripeCheckoutSession & { error?: { message?: string } })
    | null;

  if (!response.ok || !data) {
    throw new Error(
      data?.error?.message || `Stripe returned HTTP ${response.status}.`,
    );
  }

  return data;
}

export function hashSetupClaimToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function generateSetupClaimToken(): string {
  return `${CLAIM_PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
}

export async function createSetupClaimFromCheckoutSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) {
    throw new Error("Invalid Stripe Checkout Session id.");
  }

  const environment = getSaaSCheckoutEnvironment();
  const session = await retrieveCheckoutSession(sessionId, environment);

  if (session.mode !== "subscription") {
    throw new Error("Checkout Session is not a subscription checkout.");
  }

  if (session.status !== "complete") {
    throw new Error("Checkout Session is not complete.");
  }

  const subscriptionId = objectId(session.subscription);
  const stripeCustomerId = objectId(session.customer);

  if (!subscriptionId || !stripeCustomerId) {
    throw new Error("Checkout Session has no customer or subscription.");
  }

  const subscription = await prisma.billingSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      billingCustomer: true,
      provisioning: true,
    },
  });

  if (!subscription || !subscription.provisioning) {
    throw new Error("Provisioning is not ready yet.");
  }

  if (subscription.environment !== toDbEnvironment(environment)) {
    throw new Error("Checkout Session environment does not match billing data.");
  }

  if (subscription.billingCustomer.stripeCustomerId !== stripeCustomerId) {
    throw new Error("Checkout Session customer does not match billing data.");
  }

  if (!shouldProvisionSubscription(subscription.status)) {
    throw new Error("Subscription is not eligible for setup.");
  }

  if (subscription.provisioning.status !== "PENDING_SETUP") {
    throw new Error(
      `Provisioning cannot be claimed from status ${subscription.provisioning.status}.`,
    );
  }

  const provisioning = subscription.provisioning;
  const token = generateSetupClaimToken();
  const tokenHash = hashSetupClaimToken(token);
  const expiresAt = new Date(
    Date.now() + SAAS_SETUP_CLAIM_TTL_MINUTES * 60 * 1000,
  );

  const claim = await prisma.$transaction(async (tx) => {
    const lockKey = `saas-setup-claim:${provisioning.id}`;
    await tx.$queryRaw<Array<{ acquired: number }>>`
      SELECT 1::int AS acquired
      FROM pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `;

    const freshProvisioning = await tx.saasProvisioning.findUnique({
      where: { id: provisioning.id },
      include: { billingSubscription: true },
    });

    if (!freshProvisioning || freshProvisioning.status !== "PENDING_SETUP") {
      throw new Error("Provisioning is no longer available for setup claim.");
    }

    if (!shouldProvisionSubscription(freshProvisioning.billingSubscription.status)) {
      throw new Error("Subscription is no longer eligible for setup.");
    }

    await tx.saasSetupClaim.updateMany({
      where: {
        provisioningId: provisioning.id,
        usedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    return tx.saasSetupClaim.create({
      data: {
        provisioningId: provisioning.id,
        tokenHash,
        hint: token.slice(-6),
        expiresAt,
      },
    });
  });

  return {
    token,
    expiresAt: claim.expiresAt,
    provisioningId: provisioning.id,
    planCode: provisioning.planCode,
    environment: provisioning.environment,
  };
}

export async function consumeSetupClaimToken(token: string) {
  if (!token.startsWith(CLAIM_PREFIX) || token.length < CLAIM_PREFIX.length + 20) {
    throw new Error("Invalid setup claim token.");
  }

  const tokenHash = hashSetupClaimToken(token);

  return prisma.$transaction(async (tx) => {
    const lockKey = `saas-setup-claim-token:${tokenHash}`;
    await tx.$queryRaw<Array<{ acquired: number }>>`
      SELECT 1::int AS acquired
      FROM pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
    `;

    const claim = await tx.saasSetupClaim.findUnique({
      where: { tokenHash },
      include: {
        provisioning: {
          include: { billingSubscription: true },
        },
      },
    });

    if (!claim) throw new Error("Setup claim token is invalid.");
    if (claim.revokedAt) throw new Error("Setup claim token has been revoked.");
    if (claim.usedAt) throw new Error("Setup claim token has already been used.");
    if (claim.expiresAt.getTime() <= Date.now()) {
      throw new Error("Setup claim token has expired.");
    }

    if (claim.provisioning.status !== "PENDING_SETUP") {
      throw new Error(
        `Provisioning cannot be claimed from status ${claim.provisioning.status}.`,
      );
    }

    if (!shouldProvisionSubscription(claim.provisioning.billingSubscription.status)) {
      throw new Error("Subscription is not eligible for setup.");
    }

    const now = new Date();

    await tx.saasSetupClaim.update({
      where: { id: claim.id },
      data: { usedAt: now },
    });

    const provisioning = await tx.saasProvisioning.update({
      where: { id: claim.provisioningId },
      data: {
        status: "CLAIMED",
        claimedAt: now,
        failedAt: null,
        lastError: null,
      },
    });

    return {
      provisioningId: provisioning.id,
      clientId: provisioning.clientId,
      planCode: provisioning.planCode,
      environment: provisioning.environment,
      status: provisioning.status,
      claimedAt: provisioning.claimedAt,
      entitlements: provisioning.entitlements as Prisma.JsonValue,
    };
  });
}
