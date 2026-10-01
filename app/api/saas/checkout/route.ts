import { NextResponse } from "next/server";

import {
  createSaaSCheckoutSession,
  type SaaSCheckoutEnvironment,
} from "@/lib/saas/stripe-checkout";
import type { BillingInterval } from "@/lib/saas/billing";
import type { StaarkPlanCode } from "@/lib/saas/plans";

export const runtime = "nodejs";

const PLAN_CODES = new Set<StaarkPlanCode>(["STARTER", "SAAS", "BUSINESS"]);
const INTERVALS = new Set<BillingInterval>(["month", "year"]);

function isPlanCode(value: unknown): value is StaarkPlanCode {
  return typeof value === "string" && PLAN_CODES.has(value as StaarkPlanCode);
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return typeof value === "string" && INTERVALS.has(value as BillingInterval);
}

function normalizeOrigin(request: Request): string {
  const configured = process.env.SAAS_PUBLIC_ORIGIN?.trim();
  if (configured) {
    return new URL(configured).origin;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { planCode?: unknown; interval?: unknown }
    | null;

  if (!body || !isPlanCode(body.planCode) || !isBillingInterval(body.interval)) {
    return NextResponse.json(
      { error: "Invalid planCode or billing interval." },
      { status: 400 },
    );
  }

  try {
    const session = await createSaaSCheckoutSession({
      planCode: body.planCode,
      interval: body.interval,
      origin: normalizeOrigin(request),
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
      environment: session.environment satisfies SaaSCheckoutEnvironment,
      planCode: session.planCode,
      interval: session.interval,
      trialDays: session.trialDays,
    });
  } catch (error) {
    console.error("[SAAS CHECKOUT] Could not create checkout session:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create Stripe Checkout Session.",
      },
      { status: 500 },
    );
  }
}
