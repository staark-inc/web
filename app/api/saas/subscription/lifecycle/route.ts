import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  SaaSSubscriptionLifecycleError,
  type SaaSSubscriptionLifecycleAction,
  updateSaaSSubscriptionLifecycle,
} from "@/lib/saas/subscription-lifecycle";

export const runtime = "nodejs";

const ACTIONS = new Set<SaaSSubscriptionLifecycleAction>(["CANCEL", "RESUME"]);

function text(value: unknown, max = 160): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isAction(value: unknown): value is SaaSSubscriptionLifecycleAction {
  return typeof value === "string" && ACTIONS.has(value as SaaSSubscriptionLifecycleAction);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { stripeSubscriptionId?: unknown; action?: unknown }
    | null;

  const stripeSubscriptionId = text(body?.stripeSubscriptionId);
  const action = body?.action;

  if (!stripeSubscriptionId.startsWith("sub_") || !isAction(action)) {
    return NextResponse.json(
      { error: "Invalid stripeSubscriptionId or lifecycle action." },
      { status: 400 },
    );
  }

  try {
    const result = await updateSaaSSubscriptionLifecycle({
      stripeSubscriptionId,
      action,
    });

    return NextResponse.json({
      ok: true,
      ...result,
      pendingWebhookSync: true,
    });
  } catch (error) {
    if (error instanceof SaaSSubscriptionLifecycleError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status },
      );
    }

    console.error("[SAAS LIFECYCLE] Could not update subscription lifecycle:", error);
    return NextResponse.json(
      { error: "Could not update SaaS subscription lifecycle." },
      { status: 500 },
    );
  }
}
