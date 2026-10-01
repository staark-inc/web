import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  reactivateSaaSSubscription,
  SaaSReactivationError,
} from "@/lib/saas/reactivation";

export const runtime = "nodejs";

function text(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { stripeSubscriptionId?: unknown }
    | null;
  const stripeSubscriptionId = text(body?.stripeSubscriptionId);

  if (!stripeSubscriptionId.startsWith("sub_")) {
    return NextResponse.json(
      { error: "Invalid stripeSubscriptionId." },
      { status: 400 },
    );
  }

  try {
    const result = await reactivateSaaSSubscription({ stripeSubscriptionId });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof SaaSReactivationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    console.error("[SAAS REACTIVATION] Could not reactivate subscription:", error);
    return NextResponse.json(
      { error: "Could not reactivate SaaS subscription." },
      { status: 500 },
    );
  }
}
