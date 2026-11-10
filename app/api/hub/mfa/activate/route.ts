import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  MfaConfigurationError,
  activateMfaEnrollment,
} from "@/lib/mfa";
import {
  consumeMfaActivationLimit,
} from "@/lib/mfa-rate-limit";
import {
  RequestBodyError,
  readBoundedBody,
} from "@/lib/request-body";
import {
  clientIp,
  sameOriginRequest,
} from "@/lib/request-security";
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs";

const MFA_BODY_LIMIT = 8 * 1024;

function noStore(
  response: NextResponse
): NextResponse {
  response.headers.set(
    "Cache-Control",
    "no-store"
  );
  return response;
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return noStore(
      NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    );
  }

  if (!sameOriginRequest(request)) {
    return noStore(
      NextResponse.json(
        { error: "Invalid origin." },
        { status: 403 }
      )
    );
  }

  try {
    const limit =
      await consumeMfaActivationLimit(
        session.userId
      );

    if (!limit.allowed) {
      return noStore(
        NextResponse.json(
          {
            error:
              "Too many activation attempts. Try again later.",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                limit.retryAfter
              ),
            },
          }
        )
      );
    }

    const body = await readBoundedBody(
      request,
      MFA_BODY_LIMIT
    );
    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    if (!code) {
      return noStore(
        NextResponse.json(
          { error: "Enter a verification code." },
          { status: 400 }
        )
      );
    }

    const result =
      await activateMfaEnrollment({
        userId: session.userId,
        code,
        ip: clientIp(request),
      });

    if (result.kind === "invalid") {
      return noStore(
        NextResponse.json(
          {
            error:
              "Invalid or expired verification code.",
          },
          { status: 401 }
        )
      );
    }

    const token = await createSessionToken({
      userId: result.userId,
      email: result.email,
      role: "ADMIN",
      sessionVersion: result.sessionVersion,
    });

    const response = NextResponse.json({
      ok: true,
      recoveryCodes: result.recoveryCodes,
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      ...sessionCookieOptions(),
    });

    return noStore(response);
  } catch (error) {
    if (
      error instanceof MfaConfigurationError
    ) {
      console.error(
        "[MFA] Activation configuration is invalid."
      );
      return noStore(
        NextResponse.json(
          {
            error:
              "Two-factor activation is temporarily unavailable.",
          },
          { status: 503 }
        )
      );
    }

    if (error instanceof RequestBodyError) {
      return noStore(
        NextResponse.json(
          {
            error:
              error.code === "too_large"
                ? "Activation request is too large."
                : "Could not read the activation request.",
          },
          { status: error.status }
        )
      );
    }

    console.error("[MFA] Activation failed.");
    return noStore(
      NextResponse.json(
        {
          error:
            "Could not activate two-factor authentication.",
        },
        { status: 500 }
      )
    );
  }
}
