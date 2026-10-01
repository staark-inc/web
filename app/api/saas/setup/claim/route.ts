import { NextResponse } from "next/server";

import { provisionNextSite } from "@/lib/saas/next-provisioning";
import { consumeSetupClaimToken } from "@/lib/saas/setup-claim";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    if (!token) {
      return NextResponse.json(
        { error: "token is required." },
        { status: 400 },
      );
    }

    const claimed =
      await consumeSetupClaimToken(token);

    const next =
      await provisionNextSite(
        claimed.provisioningId,
      );

    return NextResponse.json({
      ok: true,

      provisioning: {
        id: claimed.provisioningId,
        clientId: claimed.clientId,
        planCode: claimed.planCode,
        environment: claimed.environment,
        status: next.setupCompleted
          ? "ACTIVE"
          : "CLAIMED",
        claimedAt:
          claimed.claimedAt?.toISOString() ??
          null,
        entitlements:
          claimed.entitlements,
      },

      next,
      setupUrl: next.setupUrl,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not start setup.";

    console.error(
      "[SAAS] Could not start Staark Next setup:",
      error,
    );

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
