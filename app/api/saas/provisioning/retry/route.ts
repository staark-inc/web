import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureProvisioningForSubscription,
  shouldProvisionSubscription,
} from "@/lib/saas/provisioning";
import { createAdminSetupClaim } from "@/lib/saas/setup-claim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function POST(
  request: Request,
) {
  const session =
    await getSession();

  if (
    !session ||
    session.role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status:
          401,
      },
    );
  }

  try {
    const body =
      await request
        .json()
        .catch(() => null) as
        | {
            subscriptionId?: unknown;
          }
        | null;

    const subscriptionId =
      text(
        body?.subscriptionId,
      );

    if (!subscriptionId) {
      return NextResponse.json(
        {
          error:
            "subscriptionId is required.",
        },
        {
          status:
            400,
        },
      );
    }

    const subscription =
      await prisma.billingSubscription.findUnique({
        where: {
          id:
            subscriptionId,
        },

        include: {
          provisioning:
            true,
        },
      });

    if (!subscription) {
      return NextResponse.json(
        {
          error:
            "Billing subscription not found.",
        },
        {
          status:
            404,
        },
      );
    }

    if (
      !shouldProvisionSubscription(
        subscription.status,
      )
    ) {
      return NextResponse.json(
        {
          error:
            `Subscription status ${subscription.status} is not eligible for provisioning.`,
        },
        {
          status:
            409,
        },
      );
    }

    if (
      subscription.provisioning
        ?.status === "ACTIVE"
    ) {
      return NextResponse.json(
        {
          error:
            "Provisioning is already active.",
        },
        {
          status:
            409,
        },
      );
    }

    const provisioning =
      subscription.provisioning ??
      await ensureProvisioningForSubscription(
        subscription,
      );

    if (!provisioning) {
      throw new Error(
        "Could not create provisioning state.",
      );
    }

    const claim =
      await createAdminSetupClaim(
        provisioning.id,
      );

    const setupUrl =
      `/saas/setup?token=${encodeURIComponent(
        claim.token,
      )}`;

    return NextResponse.json({
      ok: true,

      provisioningId:
        claim.provisioningId,

      expiresAt:
        claim.expiresAt.toISOString(),

      setupUrl,
    });
  } catch (error) {
    console.error(
      "[SAAS OPS] Provisioning retry failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Provisioning retry failed.",
      },
      {
        status:
          500,
      },
    );
  }
}
