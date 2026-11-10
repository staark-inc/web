import { NextResponse } from "next/server";

import {
  createSetupClaimFromCheckoutSession,
  isStripeCheckoutSessionId,
} from "@/lib/saas/setup-claim";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import {
  clientIp,
  hashIdentifier,
  sameOriginRequest,
} from "@/lib/request-security";

export const runtime = "nodejs";

const CLAIM_MAX_BYTES = 16 * 1024;

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
      "Setup is not allowed from this origin."
    );
  }

  try {
    const globalLimit = await consumeRateLimit({
      key: "saas:claim:global",
      limit: 100,
      windowMs: 10 * 60 * 1000,
    });

    if (!globalLimit.allowed) {
      return errorResponse(
        429,
        "Too many setup attempts. Try again later.",
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
        key: `saas:claim:ip:${hashIdentifier(
          ip
        )}`,
        limit: 10,
        windowMs: 10 * 60 * 1000,
      });

      if (!ipLimit.allowed) {
        return errorResponse(
          429,
          "Too many setup attempts. Try again later.",
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
      CLAIM_MAX_BYTES
    );

    const sessionId =
      typeof body.sessionId === "string"
        ? body.sessionId.trim()
        : "";

    if (!isStripeCheckoutSessionId(sessionId)) {
      return errorResponse(
        400,
        "Invalid checkout session."
      );
    }

    const sessionLimit = await consumeRateLimit({
      key: `saas:claim:session:${hashIdentifier(
        sessionId
      )}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!sessionLimit.allowed) {
      return errorResponse(
        429,
        "Too many setup attempts. Try again later.",
        {
          "Retry-After": String(
            sessionLimit.retryAfter
          ),
        }
      );
    }

    const claim =
      await createSetupClaimFromCheckoutSession(
        sessionId
      );

    return noStore(
      NextResponse.json({
        ok: true,
        token: claim.token,
        expiresAt: claim.expiresAt.toISOString(),
        provisioningId: claim.provisioningId,
        planCode: claim.planCode,
        environment: claim.environment,
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
            : "Could not read the setup request."
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "unknown error";

    console.error(
      "[SAAS] Could not create setup claim token:",
      redactStripeId(message)
    );

    if (message === "Provisioning is not ready yet.") {
      return errorResponse(409, message);
    }

    if (
      message.startsWith(
        "Too many active setup links."
      )
    ) {
      return errorResponse(409, message);
    }

    return errorResponse(
      400,
      "Could not create setup claim."
    );
  }
}
