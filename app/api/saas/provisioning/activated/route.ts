import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CLOCK_SKEW_SECONDS = 300;

function safeEqualHex(a: string, b: string): boolean {
  try {
    const aa = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");

    return (
      aa.length > 0 &&
      aa.length === bb.length &&
      crypto.timingSafeEqual(aa, bb)
    );
  } catch {
    return false;
  }
}

function verifySignature(
  body: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
): boolean {
  if (!timestamp || !signature) return false;

  const unix = Number(timestamp);
  if (!Number.isInteger(unix)) return false;

  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - unix) > MAX_CLOCK_SKEW_SECONDS) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  return safeEqualHex(expected, signature);
}

export async function POST(request: Request) {
  const secret = process.env.STAARK_PROVISIONING_SECRET?.trim();

  if (!secret) {
    return NextResponse.json(
      {
        ok: false,
        error: "STAARK_PROVISIONING_SECRET is not configured.",
      },
      { status: 503 },
    );
  }

  const rawBody = await request.text();

  if (
    !verifySignature(
      rawBody,
      request.headers.get("x-staark-timestamp"),
      request.headers.get("x-staark-signature"),
      secret,
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "Invalid activation signature." },
      { status: 401 },
    );
  }

  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>;

    const siteId =
      typeof body.siteId === "string"
        ? body.siteId.trim()
        : "";

    const siteKey =
      typeof body.siteKey === "string"
        ? body.siteKey.trim()
        : "";

    const ownerEmail =
      typeof body.ownerEmail === "string"
        ? body.ownerEmail.trim()
        : null;

    if (!siteId) {
      return NextResponse.json(
        { ok: false, error: "siteId is required." },
        { status: 400 },
      );
    }

    const provisioning =
      await prisma.saasProvisioning.findUnique({
        where: {
          nextSiteId: siteId,
        },
      });

    if (!provisioning) {
      return NextResponse.json(
        {
          ok: false,
          error: "Staark Next site is not linked to a Hub provisioning.",
        },
        { status: 404 },
      );
    }

    if (
      siteKey &&
      provisioning.nextSiteKey &&
      provisioning.nextSiteKey !== siteKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Staark Next site identity does not match Hub binding.",
        },
        { status: 409 },
      );
    }

    const now = new Date();

    const updated =
      await prisma.saasProvisioning.update({
        where: {
          id: provisioning.id,
        },
        data: {
          status: "ACTIVE",
          activatedAt:
            provisioning.activatedAt ?? now,
          nextSetupExpiresAt: null,
          failedAt: null,
          lastError: null,
        },
      });

    console.info(
      "[SAAS] Staark Next setup activated:",
      {
        provisioningId: updated.id,
        siteId,
        siteKey,
        ownerEmail,
      },
    );

    return NextResponse.json({
      ok: true,
      provisioningId: updated.id,
      status: updated.status,
      activatedAt:
        updated.activatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error(
      "[SAAS] Could not activate Staark Next provisioning:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not activate provisioning.",
      },
      { status: 400 },
    );
  }
}
