import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

function config() {
  const base =
    process.env.STAARK_RUNTIME_INTERNAL_URL
      ?.trim()
      .replace(/\/+$/, "");

  const secret =
    process.env.STAARK_PROVISIONING_SECRET
      ?.trim();

  if (!base) {
    throw new Error(
      "STAARK_RUNTIME_INTERNAL_URL is not configured.",
    );
  }

  if (!secret) {
    throw new Error(
      "STAARK_PROVISIONING_SECRET is not configured.",
    );
  }

  return {
    url:
      `${base}/api/staark/subscription/sync`,
    secret,
  };
}

function sign(
  body: string,
  timestamp: string,
  secret: string,
) {
  return crypto
    .createHmac(
      "sha256",
      secret,
    )
    .update(
      `${timestamp}.${body}`,
    )
    .digest("hex");
}

export async function syncRuntimeSubscription(
  stripeSubscriptionId: string,
) {
  const subscription =
    await prisma.billingSubscription.findUnique({
      where: {
        stripeSubscriptionId,
      },

      select: {
        stripeSubscriptionId: true,
        planCode: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        trialEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

  if (!subscription) {
    return;
  }

  const payload = {
    stripeSubscriptionId:
      subscription.stripeSubscriptionId,

    planCode:
      subscription.planCode,

    status:
      subscription.status,

    currentPeriodStart:
      subscription.currentPeriodStart
        ?.toISOString() ?? null,

    currentPeriodEnd:
      subscription.currentPeriodEnd
        ?.toISOString() ?? null,

    trialEnd:
      subscription.trialEnd
        ?.toISOString() ?? null,

    cancelAtPeriodEnd:
      subscription.cancelAtPeriodEnd,
  };

  const body =
    JSON.stringify(payload);

  const timestamp =
    Math.floor(
      Date.now() / 1000,
    ).toString();

  const { url, secret } =
    config();

  const response =
    await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "X-Staark-Timestamp":
          timestamp,

        "X-Staark-Signature":
          sign(
            body,
            timestamp,
            secret,
          ),
      },

      body,
      cache: "no-store",
    });

  const data =
    await response
      .json()
      .catch(() => null) as
      | {
          ok?: boolean;
          error?: string;
        }
      | null;

  if (
    !response.ok ||
    !data?.ok
  ) {
    throw new Error(
      data?.error ||
        `Runtime returned HTTP ${response.status}.`,
    );
  }
}
