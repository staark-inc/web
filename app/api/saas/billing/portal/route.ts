import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import {
  createSaaSBillingPortalSession,
} from "@/lib/saas/stripe-checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CLOCK_SKEW_SECONDS = 300;

function safeEqualHex(
  left: string,
  right: string,
): boolean {
  try {
    const a =
      Buffer.from(
        left,
        "hex",
      );

    const b =
      Buffer.from(
        right,
        "hex",
      );

    return (
      a.length > 0 &&
      a.length === b.length &&
      crypto.timingSafeEqual(
        a,
        b,
      )
    );
  } catch {
    return false;
  }
}

function verifyRuntimeRequest(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
): boolean {
  const secret =
    process.env
      .STAARK_PROVISIONING_SECRET
      ?.trim();

  if (
    !secret ||
    !timestamp ||
    !signature
  ) {
    return false;
  }

  const unix =
    Number(timestamp);

  if (
    !Number.isInteger(unix)
  ) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() / 1000,
    );

  if (
    Math.abs(
      now - unix,
    ) >
    MAX_CLOCK_SKEW_SECONDS
  ) {
    return false;
  }

  const expected =
    crypto
      .createHmac(
        "sha256",
        secret,
      )
      .update(
        `${timestamp}.${rawBody}`,
      )
      .digest(
        "hex",
      );

  return safeEqualHex(
    expected,
    signature,
  );
}

function requiredString(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${field} is required.`,
    );
  }

  return value.trim();
}

function validateReturnUrl(
  value: string,
): string {
  const url =
    new URL(value);

  if (
    process.env.NODE_ENV ===
      "production" &&
    url.protocol !== "https:"
  ) {
    throw new Error(
      "Billing return URL must use HTTPS.",
    );
  }

  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:"
  ) {
    throw new Error(
      "Billing return URL protocol is invalid.",
    );
  }

  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "Billing return URL credentials are not allowed.",
    );
  }

  if (
    url.pathname !==
    "/admin/plan"
  ) {
    throw new Error(
      "Billing return URL must point to /admin/plan.",
    );
  }

  return url.toString();
}

export async function POST(
  request: Request,
) {
  const rawBody =
    await request.text();

  if (
    !verifyRuntimeRequest(
      rawBody,
      request.headers.get(
        "x-staark-timestamp",
      ),
      request.headers.get(
        "x-staark-signature",
      ),
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid runtime signature.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const body =
      JSON.parse(
        rawBody,
      ) as Record<
        string,
        unknown
      >;

    const stripeSubscriptionId =
      requiredString(
        body.stripeSubscriptionId,
        "stripeSubscriptionId",
      );

    const runtimeSiteId =
      requiredString(
        body.runtimeSiteId,
        "runtimeSiteId",
      );

    const returnUrl =
      validateReturnUrl(
        requiredString(
          body.returnUrl,
          "returnUrl",
        ),
      );

    const subscription =
      await prisma
        .billingSubscription
        .findUnique({
          where: {
            stripeSubscriptionId,
          },

          include: {
            billingCustomer:
              true,

            provisioning:
              true,
          },
        });

    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Billing subscription was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !subscription
        .provisioning
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subscription has no runtime provisioning.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      subscription
        .provisioning
        .nextSiteId !==
      runtimeSiteId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime tenant does not match this subscription.",
        },
        {
          status: 403,
        },
      );
    }

    if (
      subscription
        .provisioning
        .status !==
      "ACTIVE"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Runtime provisioning is not active.",
        },
        {
          status: 409,
        },
      );
    }

    const environment =
      subscription.environment ===
      "LIVE"
        ? "live"
        : "test";

    const session =
      await createSaaSBillingPortalSession(
        {
          environment,

          customerId:
            subscription
              .billingCustomer
              .stripeCustomerId,

          returnUrl,
        },
      );

    return NextResponse.json({
      ok: true,

      url:
        session.url,
    });
  } catch (error) {
    console.error(
      "[SAAS BILLING PORTAL]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Could not create billing portal session.",
      },
      {
        status: 502,
      },
    );
  }
}
