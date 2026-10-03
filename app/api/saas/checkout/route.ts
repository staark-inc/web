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

  const headers = new Headers(request.headers);
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host")?.trim();
  const requestUrl = new URL(request.url);
  const protocol = forwardedProto || requestUrl.protocol.replace(":", "");

  if (host) {
    const candidate = new URL(`${protocol}://${host}`);
    if (candidate.hostname !== "0.0.0.0" && candidate.hostname !== "::") {
      return candidate.origin;
    }
  }

  if (requestUrl.hostname !== "0.0.0.0" && requestUrl.hostname !== "::") {
    return requestUrl.origin;
  }

  throw new Error(
    "SAAS_PUBLIC_ORIGIN must be configured when the app is bound to 0.0.0.0.",
  );
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
