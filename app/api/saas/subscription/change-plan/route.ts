import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  changeSaaSSubscriptionPlan,
  SaaSPlanChangeError,
} from "@/lib/saas/plan-changes";
import type { StaarkPlanCode } from "@/lib/saas/plans";

export const runtime = "nodejs";

const PLAN_CODES = new Set<StaarkPlanCode>(["STARTER", "SAAS", "BUSINESS"]);

function text(value: unknown, max = 160): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isPlanCode(value: unknown): value is StaarkPlanCode {
  return typeof value === "string" && PLAN_CODES.has(value as StaarkPlanCode);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { stripeSubscriptionId?: unknown; targetPlanCode?: unknown }
    | null;

  const stripeSubscriptionId = text(body?.stripeSubscriptionId);
  const targetPlanCode = body?.targetPlanCode;

  if (!stripeSubscriptionId.startsWith("sub_") || !isPlanCode(targetPlanCode)) {
    return NextResponse.json(
      { error: "Invalid stripeSubscriptionId or targetPlanCode." },
      { status: 400 },
    );
  }

  try {
    const result = await changeSaaSSubscriptionPlan({
      stripeSubscriptionId,
      targetPlanCode,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      pendingWebhookSync: true,
    });
  } catch (error) {
    if (error instanceof SaaSPlanChangeError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status },
      );
    }

    console.error("[SAAS PLAN CHANGE] Could not change subscription plan:", error);
    return NextResponse.json(
      { error: "Could not change SaaS subscription plan." },
      { status: 500 },
    );
  }
}
