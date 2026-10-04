import { prisma } from "@/lib/prisma";

import {
  controlPath,
  signControlRequest,
} from "./control-protocol";

function config() {
  const base =
    process.env
      .STAARK_RUNTIME_INTERNAL_URL
      ?.trim()
      .replace(/\/+$/, "");

  const secret =
    process.env
      .STAARK_PROVISIONING_SECRET
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

async function reserveRuntimeSync(
  stripeSubscriptionId: string,
) {
  return prisma.$transaction(
    async (tx) => {
      const current =
        await tx
          .billingSubscription
          .findUnique({
            where: {
              stripeSubscriptionId,
            },

            select: {
              id: true,
            },
          });

      if (!current) {
        return null;
      }

      /*
       * Atomic increment is the ordering source of truth.
       *
       * Concurrent sends may reach Runtime in reverse network order, but
       * Runtime will only apply the greatest sequence.
       */
      return tx
        .billingSubscription
        .update({
          where: {
            id:
              current.id,
          },

          data: {
            runtimeSyncVersion: {
              increment: 1,
            },
          },

          select: {
            stripeSubscriptionId:
              true,

            planCode:
              true,

            status:
              true,

            currentPeriodStart:
              true,

            currentPeriodEnd:
              true,

            cancelAtPeriodEnd:
              true,

            runtimeSyncVersion:
              true,
          },
        });
    },
  );
}

export async function syncRuntimeSubscription(
  stripeSubscriptionId: string,
) {
  const subscription =
    await reserveRuntimeSync(
      stripeSubscriptionId,
    );

  if (!subscription) {
    return;
  }

  const sequence =
    subscription
      .runtimeSyncVersion;

  const eventId =
    `subscription:${subscription.stripeSubscriptionId}:${sequence}`;

  const payload = {
    stripeSubscriptionId:
      subscription
        .stripeSubscriptionId,

    planCode:
      subscription.planCode,

    status:
      subscription.status,

    currentPeriodStart:
      subscription
        .currentPeriodStart
        ?.toISOString() ??
      null,

    currentPeriodEnd:
      subscription
        .currentPeriodEnd
        ?.toISOString() ??
      null,

    cancelAtPeriodEnd:
      subscription
        .cancelAtPeriodEnd,
  };

  const body =
    JSON.stringify(payload);

  const {
    url,
    secret,
  } =
    config();

  const signed =
    signControlRequest({
      method:
        "POST",

      path:
        controlPath(url),

      body,

      eventId,

      sequence,

      secret,
    });

  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          ...signed,
        },

        body,
        cache:
          "no-store",
      },
    );

  const data =
    await response
      .json()
      .catch(
        () => null,
      ) as
      | {
          ok?: boolean;
          error?: string;
          skipped?: boolean;
          reason?: string;
          publicAccess?: boolean;
          status?: string;
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

  return {
    ok:
      true as const,

    skipped:
      data.skipped ===
      true,

    reason:
      data.reason ??
      null,

    publicAccess:
      typeof data.publicAccess ===
        "boolean"
        ? data.publicAccess
        : null,

    status:
      data.status ??
      null,

    protocol:
      2 as const,

    eventId,

    sequence:
      sequence.toString(),
  };
}
