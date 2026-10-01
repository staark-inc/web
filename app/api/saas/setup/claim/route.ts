import { NextResponse } from "next/server";

import { consumeSetupClaimToken } from "@/lib/saas/setup-claim";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { error: "token is required." },
        { status: 400 },
      );
    }

    const result = await consumeSetupClaimToken(token);

    return NextResponse.json({
      ok: true,
      provisioning: {
        id: result.provisioningId,
        clientId: result.clientId,
        planCode: result.planCode,
        environment: result.environment,
        status: result.status,
        claimedAt: result.claimedAt?.toISOString() ?? null,
        entitlements: result.entitlements,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not claim setup.";
    console.error("[SAAS] Could not consume setup claim token:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
