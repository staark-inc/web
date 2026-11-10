import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  MfaConfigurationError,
  disableMfa,
} from "@/lib/mfa";
import {
  MFA_COOKIE,
  mfaCookieOptions,
} from "@/lib/mfa-challenge";
import {
  consumeMfaDisableLimit,
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
    const limit = await consumeMfaDisableLimit(
      session.userId
    );

    if (!limit.allowed) {
      return noStore(
        NextResponse.json(
          {
            error:
              "Too many disable attempts. Try again later.",
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
    const password =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : "";
    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    if (!password || !code) {
      return noStore(
        NextResponse.json(
          {
            error:
              "Current password and verification code are required.",
          },
          { status: 400 }
        )
      );
    }

    const result = await disableMfa({
      userId: session.userId,
      password,
      code,
      ip: clientIp(request),
    });

    if (result.kind === "invalid") {
      return noStore(
        NextResponse.json(
          {
            error:
              "Invalid password or verification code.",
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
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      ...sessionCookieOptions(),
    });
    response.cookies.set({
      name: MFA_COOKIE,
      value: "",
      ...mfaCookieOptions(),
      expires: new Date(0),
      maxAge: 0,
    });

    return noStore(response);
  } catch (error) {
    if (
      error instanceof MfaConfigurationError
    ) {
      console.error(
        "[MFA] Disable configuration is invalid."
      );
      return noStore(
        NextResponse.json(
          {
            error:
              "Two-factor changes are temporarily unavailable.",
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
                ? "Disable request is too large."
                : "Could not read the disable request.",
          },
          { status: error.status }
        )
      );
    }

    console.error("[MFA] Disable failed.");
    return noStore(
      NextResponse.json(
        {
          error:
            "Could not disable two-factor authentication.",
        },
        { status: 500 }
      )
    );
  }
}
