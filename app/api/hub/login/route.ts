import { NextResponse } from "next/server";

import { authenticateLogin } from "@/lib/login";
import { redirectTo } from "@/lib/redirect";
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
  sessionCookieOptions,
} from "@/lib/session";

export const runtime = "nodejs";

const LOGIN_MAX_BYTES = 64 * 1024;

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
      {
        ok: false,
        error,
      },
      {
        status,
        headers,
      }
    )
  );
}

export async function POST(request: Request) {
  const contentType =
    request.headers.get("content-type") ?? "";
  const isJson =
    contentType
      .split(";")[0]
      .trim()
      .toLowerCase() === "application/json";

  if (!sameOriginRequest(request)) {
    return errorResponse(
      403,
      "Sign-in is not allowed from this origin."
    );
  }

  try {
    const body = await readBoundedBody(
      request,
      LOGIN_MAX_BYTES
    );

    const email = String(
      body.email ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password ?? ""
    );

    if (
      !email ||
      !password ||
      email.length > 320
    ) {
      return errorResponse(
        400,
        "Email and password are required."
      );
    }

    const result = await authenticateLogin({
      email,
      password,
      ip: clientIp(request),
    });

    if (result.kind === "rate_limited") {
      return errorResponse(
        429,
        "Too many sign-in attempts. Try again later.",
        {
          "Retry-After": String(
            result.retryAfter
          ),
        }
      );
    }

    if (result.kind === "invalid") {
      // Unknown account, wrong password, disabled account and non-admin all
      // share this exact response.
      return errorResponse(
        401,
        "Invalid email or password."
      );
    }

    const response = isJson
      ? NextResponse.json({
          ok: true,
          user: result.user,
        })
      : redirectTo(
          "/hub",
          request,
          303
        );

    response.cookies.set({
      name: SESSION_COOKIE,
      value: result.token,
      ...sessionCookieOptions(),
    });

    return noStore(response);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      const message =
        error.code === "too_large"
          ? "Request body is too large."
          : error.code === "unsupported"
            ? "Unsupported content type."
            : "Could not read the sign-in request.";

      return errorResponse(
        error.status,
        message
      );
    }

    console.error(
      "Hub login failed.",
      error
    );

    return errorResponse(
      503,
      "Sign-in is temporarily unavailable."
    );
  }
}
