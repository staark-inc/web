import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  MfaConfigurationError,
  verifyMfaChallenge,
} from "@/lib/mfa";
import {
  MFA_COOKIE,
  mfaCookieOptions,
  verifyMfaChallengeToken,
} from "@/lib/mfa-challenge";
import {
  consumeMfaChallengeLimit,
  resetMfaChallengeLimit,
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

function errorResponse(
  status: number,
  error: string,
  headers?: Record<string, string>
) {
  return noStore(
    NextResponse.json(
      { ok: false, error },
      { status, headers }
    )
  );
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return errorResponse(
      403,
      "Verification is not allowed from this origin."
    );
  }

  const cookieStore = await cookies();
  const challengeToken = cookieStore.get(
    MFA_COOKIE
  )?.value;

  const challenge = challengeToken
    ? await verifyMfaChallengeToken(
        challengeToken
      )
    : null;

  if (!challenge) {
    const response = errorResponse(
      401,
      "Your verification session has expired. Sign in again."
    );
    response.cookies.set({
      name: MFA_COOKIE,
      value: "",
      ...mfaCookieOptions(),
      expires: new Date(0),
      maxAge: 0,
    });
    return response;
  }

  try {
    const limit = await consumeMfaChallengeLimit({
      userId: challenge.userId,
      ip: clientIp(request),
    });

    if (!limit.allowed) {
      return errorResponse(
        429,
        "Too many verification attempts. Try again later.",
        {
          "Retry-After": String(
            limit.retryAfter
          ),
        }
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
      return errorResponse(
        400,
        "Enter a verification code."
      );
    }

    const result = await verifyMfaChallenge({
      userId: challenge.userId,
      sessionVersion: challenge.sessionVersion,
      code,
      ip: clientIp(request),
    });

    if (result.kind === "invalid") {
      return errorResponse(
        401,
        "Invalid verification code."
      );
    }

    await resetMfaChallengeLimit(
      result.userId
    ).catch(() => undefined);

    const token = await createSessionToken({
      userId: result.userId,
      email: result.email,
      role: "ADMIN",
      sessionVersion: result.sessionVersion,
    });

    const response =
      NextResponse.json({ ok: true });

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
        "[MFA] Verification configuration is invalid."
      );
      return errorResponse(
        503,
        "Two-factor verification is temporarily unavailable."
      );
    }

    if (error instanceof RequestBodyError) {
      return errorResponse(
        error.status,
        error.code === "too_large"
          ? "Verification request is too large."
          : "Could not read the verification request."
      );
    }

    console.error(
      "[MFA] Verification failed."
    );
    return errorResponse(
      503,
      "Two-factor verification is temporarily unavailable."
    );
  }
}
