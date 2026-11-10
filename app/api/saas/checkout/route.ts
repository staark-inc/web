import { NextResponse } from "next/server";

import {
  createSaaSCheckoutSession,
  type SaaSCheckoutEnvironment,
} from "@/lib/saas/stripe-checkout";
import type { BillingInterval } from "@/lib/saas/billing";
import type { StaarkPlanCode } from "@/lib/saas/plans";
import {
  isPromotionEligible,
  normalizeSaaSPromotionCode,
} from "@/lib/saas/promotions";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import {
  clientIp,
  hashIdentifier,
  sameOriginRequest,
  trustedProxyHeadersEnabled,
} from "@/lib/request-security";

export const runtime = "nodejs";

const CHECKOUT_MAX_BYTES = 16 * 1024;
const PLAN_CODES = new Set<StaarkPlanCode>(["STARTER", "SAAS", "BUSINESS"]);
const INTERVALS = new Set<BillingInterval>(["month", "year"]);

function isPlanCode(value: unknown): value is StaarkPlanCode {
  return typeof value === "string" && PLAN_CODES.has(value as StaarkPlanCode);
}

function isBillingInterval(value: unknown): value is BillingInterval {
  return typeof value === "string" && INTERVALS.has(value as BillingInterval);
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function normalizeOrigin(request: Request): string {
  const configured = process.env.SAAS_PUBLIC_ORIGIN?.trim();

  if (configured) {
    return new URL(configured).origin;
  }

  // sameOriginRequest() already approved this browser origin. Prefer it over
  // forwarding headers, which a caller can spoof.
  const requestOrigin =
    request.headers.get("origin");

  if (requestOrigin) {
    try {
      return new URL(requestOrigin).origin;
    } catch {
      // Fall through to the request URL.
    }
  }

  const requestUrl = new URL(request.url);

  // Never derive the Stripe return origin from caller-controlled forwarding
  // headers unless the deployment explicitly trusts its proxy.
  if (!trustedProxyHeadersEnabled()) {
    return requestUrl.origin;
  }

  const headers = new Headers(request.headers);
  const forwardedProto = firstHeaderValue(
    headers.get("x-forwarded-proto")
  );
  const forwardedHost = firstHeaderValue(
    headers.get("x-forwarded-host")
  );
  const host = forwardedHost || headers.get("host")?.trim();
  const protocol =
    forwardedProto ||
    requestUrl.protocol.replace(":", "");

  if (host) {
    try {
      const candidate = new URL(`${protocol}://${host}`);

      if (
        candidate.hostname !== "0.0.0.0" &&
        candidate.hostname !== "::"
      ) {
        return candidate.origin;
      }
    } catch {
      // Fall through to the request URL.
    }
  }

  if (
    requestUrl.hostname !== "0.0.0.0" &&
    requestUrl.hostname !== "::"
  ) {
    return requestUrl.origin;
  }

  throw new Error(
    "SAAS_PUBLIC_ORIGIN must be configured when the app is bound to 0.0.0.0."
  );
}

function noStore(
  response: NextResponse
): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function errorResponse(
  status: number,
  error: string,
  headers?: Record<string, string>
) {
  return noStore(
    NextResponse.json(
      {
        error,
      },
      {
        status,
        headers,
      }
    )
  );
}

function redactStripeId(value: string) {
  return value.replace(
    /cs_(?:test|live)_[A-Za-z0-9]+/g,
    "cs_***"
  );
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return errorResponse(
      403,
      "Checkout is not allowed from this origin."
    );
  }

  try {
    const globalLimit = await consumeRateLimit({
      key: "saas:checkout:global",
      limit: 100,
      windowMs: 60 * 60 * 1000,
    });

    if (!globalLimit.allowed) {
      return errorResponse(
        429,
        "Too many checkout attempts. Try again later.",
        {
          "Retry-After": String(
            globalLimit.retryAfter
          ),
        }
      );
    }

    const ip = clientIp(request);

    if (ip) {
      const ipLimit = await consumeRateLimit({
        key: `saas:checkout:ip:${hashIdentifier(
          ip
        )}`,
        limit: 10,
        windowMs: 60 * 60 * 1000,
      });

      if (!ipLimit.allowed) {
        return errorResponse(
          429,
          "Too many checkout attempts. Try again later.",
          {
            "Retry-After": String(
              ipLimit.retryAfter
            ),
          }
        );
      }
    }

    const body = await readBoundedBody(
      request,
      CHECKOUT_MAX_BYTES
    );

    if (
      !isPlanCode(body.planCode) ||
      !isBillingInterval(body.interval)
    ) {
      return errorResponse(
        400,
        "Invalid planCode or billing interval."
      );
    }

    const rawPromotionCode =
      typeof body.promotionCode === "string"
        ? body.promotionCode.trim()
        : "";

    const promotionCode =
      normalizeSaaSPromotionCode(
        rawPromotionCode
      );

    if (
      rawPromotionCode &&
      !promotionCode
    ) {
      return errorResponse(
        400,
        "Ogiltig rabattkod."
      );
    }

    if (
      promotionCode &&
      !isPromotionEligible(
        promotionCode,
        body.planCode,
        body.interval
      )
    ) {
      return errorResponse(
        400,
        promotionCode === "GROWTH15"
          ? "GROWTH15 gäller endast Growth med månadsbetalning."
          : "GROWTH25 gäller endast Growth med årsbetalning."
      );
    }

    const session = await createSaaSCheckoutSession({
      planCode: body.planCode,
      interval: body.interval,
      origin: normalizeOrigin(request),
      ...(promotionCode
        ? { promotionCode }
        : {}),
    });

    return noStore(
      NextResponse.json({
        ok: true,
        url: session.url,
        environment: session.environment satisfies SaaSCheckoutEnvironment,
        planCode: session.planCode,
        interval: session.interval,
        ...(session.promotionCode
          ? {
              promotionCode:
                session.promotionCode,
            }
          : {}),
      })
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(
        error.status,
        error.code === "too_large"
          ? "Request body is too large."
          : error.code === "unsupported"
            ? "Unsupported content type."
            : "Could not read the checkout request."
      );
    }

    const message =
      error instanceof Error
        ? redactStripeId(error.message)
        : "unknown error";

    console.error(
      "[SAAS CHECKOUT] Could not create checkout session:",
      message
    );

    return errorResponse(
      500,
      "Could not create Stripe Checkout Session."
    );
  }
}
