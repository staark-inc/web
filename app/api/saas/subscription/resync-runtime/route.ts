import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncRuntimeSubscription } from "@/lib/saas/runtime-subscription-sync";

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

        select: {
          stripeSubscriptionId:
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

    const result =
      await syncRuntimeSubscription(
        subscription.stripeSubscriptionId,
      );

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "[SAAS OPS] Runtime resync failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Runtime resync failed.",
      },
      {
        status:
          500,
      },
    );
  }
}
