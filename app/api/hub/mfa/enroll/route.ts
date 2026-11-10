import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import {
  MfaConfigurationError,
  startMfaEnrollment,
} from "@/lib/mfa";
import { consumeMfaEnrollmentLimit } from "@/lib/mfa-rate-limit";
import {
  clientIp,
  sameOriginRequest,
} from "@/lib/request-security";

export const runtime = "nodejs";

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
    const limit = await consumeMfaEnrollmentLimit(
      session.userId
    );

    if (!limit.allowed) {
      return noStore(
        NextResponse.json(
          {
            error:
              "Too many enrollment attempts. Try again later.",
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

    const enrollment =
      await startMfaEnrollment(
        session.userId,
        clientIp(request)
      );

    return noStore(
      NextResponse.json({
        ok: true,
        secret: enrollment.secret,
        otpauthUrl: enrollment.otpauthUrl,
        expiresAt:
          enrollment.expiresAt.toISOString(),
      })
    );
  } catch (error) {
    if (
      error instanceof MfaConfigurationError
    ) {
      console.error(
        "[MFA] Enrollment configuration is invalid."
      );
      return noStore(
        NextResponse.json(
          {
            error:
              "Two-factor enrollment is temporarily unavailable.",
          },
          { status: 503 }
        )
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message ===
      "Two-factor authentication is already enabled."
    ) {
      return noStore(
        NextResponse.json(
          { error: message },
          { status: 409 }
        )
      );
    }

    console.error(
      "[MFA] Enrollment failed."
    );
    return noStore(
      NextResponse.json(
        {
          error:
            "Could not start two-factor enrollment.",
        },
        { status: 500 }
      )
    );
  }
}
