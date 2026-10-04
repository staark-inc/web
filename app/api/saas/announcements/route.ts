import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

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

  if (!Number.isInteger(unix)) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() / 1000,
    );

  if (
    Math.abs(now - unix) >
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

function text(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
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

    const runtimeSiteId =
      text(
        body.runtimeSiteId,
      );

    const stripeSubscriptionId =
      text(
        body.stripeSubscriptionId,
      );

    if (
      !runtimeSiteId ||
      !stripeSubscriptionId
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "runtimeSiteId and stripeSubscriptionId are required.",
        },
        {
          status: 400,
        },
      );
    }

    const requestedLimit =
      Number(
        body.limit,
      );

    const limit =
      Number.isFinite(
        requestedLimit,
      )
        ? Math.min(
            50,
            Math.max(
              1,
              Math.floor(
                requestedLimit,
              ),
            ),
          )
        : 10;

    const subscription =
      await prisma
        .billingSubscription
        .findUnique({
          where: {
            stripeSubscriptionId,
          },

          include: {
            provisioning:
              true,
          },
        });

    if (!subscription) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Subscription was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !subscription
        .provisioning ||
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

    const now =
      new Date();

    const announcements =
      await prisma
        .saasAnnouncement
        .findMany({
          where: {
            published:
              true,

            publishedAt: {
              lte:
                now,
            },

            OR: [
              {
                audiencePlan:
                  null,
              },
              {
                audiencePlan:
                  subscription.planCode,
              },
            ],
          },

          orderBy: [
            { pinned: "desc" },
            {
              publishedAt:
                "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],

          take:
            limit,

          select: {
            id:
              true,

            title:
              true,

            summary:
              true,

            body:
              true,
            bodyFormat: true,
            ctaLabel: true,
            ctaUrl: true,
            coverImageUrl: true,
            pinned: true,

            kind:
              true,

            audiencePlan:
              true,

            publishedAt:
              true,
          },
        });

    return NextResponse.json({
      ok: true,

      announcements:
        announcements.map(
          (announcement) => ({
            ...announcement,

            publishedAt:
              announcement
                .publishedAt
                ?.toISOString() ??
              null,
          }),
        ),
    });
  } catch (error) {
    console.error(
      "[SAAS ANNOUNCEMENTS]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Could not load announcements.",
      },
      {
        status: 500,
      },
    );
  }
}
