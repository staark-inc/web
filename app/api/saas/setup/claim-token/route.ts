import { NextResponse } from "next/server";

import { createSetupClaimFromCheckoutSession } from "@/lib/saas/setup-claim";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const sessionId =
      typeof body.sessionId === "string" ? body.sessionId.trim() : "";

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 },
      );
    }

    const claim = await createSetupClaimFromCheckoutSession(sessionId);

    return NextResponse.json({
      ok: true,
      token: claim.token,
      expiresAt: claim.expiresAt.toISOString(),
      provisioningId: claim.provisioningId,
      planCode: claim.planCode,
      environment: claim.environment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create setup claim.";
    const status = message === "Provisioning is not ready yet." ? 409 : 400;

    console.error("[SAAS] Could not create setup claim token:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
