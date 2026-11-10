import {
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import type { NextResponse } from "next/server";

export const GOOGLE_OAUTH_STATE_COOKIE =
  "hub_google_oauth_state";

export const GOOGLE_OAUTH_STATE_TTL_SECONDS =
  10 * 60;

export type OAuthStateValidation =
  | "valid"
  | "missing"
  | "mismatch"
  | "expired";

export type OAuthState = {
  state: string;
  cookieValue: string;
  expiresAt: number;
};

export function createOAuthState(
  now = Date.now()
): OAuthState {
  const state = randomBytes(32).toString(
    "base64url"
  );

  const expiresAt =
    now + GOOGLE_OAUTH_STATE_TTL_SECONDS * 1000;

  return {
    state,
    cookieValue: `${state}.${expiresAt}`,
    expiresAt,
  };
}

export function oauthStateCookieOptions(
  secure = process.env.NODE_ENV === "production"
) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/api/hub/google",
    maxAge: GOOGLE_OAUTH_STATE_TTL_SECONDS,
  };
}

export function validateOAuthState(
  cookieValue: string | undefined,
  receivedState: string | null,
  now = Date.now()
): OAuthStateValidation {
  if (!cookieValue || !receivedState) {
    return "missing";
  }

  const separator = cookieValue.lastIndexOf(".");

  if (separator <= 0) {
    return "mismatch";
  }

  const expectedState =
    cookieValue.slice(0, separator);

  const expiresAt = Number(
    cookieValue.slice(separator + 1)
  );

  if (!Number.isFinite(expiresAt)) {
    return "mismatch";
  }

  if (expiresAt <= now) {
    return "expired";
  }

  const expected = Buffer.from(
    expectedState,
    "utf8"
  );
  const received = Buffer.from(
    receivedState,
    "utf8"
  );

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return "mismatch";
  }

  return "valid";
}

export function clearOAuthStateCookie(
  response: NextResponse,
  secure = process.env.NODE_ENV === "production"
) {
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: "",
    ...oauthStateCookieOptions(secure),
    expires: new Date(0),
    maxAge: 0,
  });
}
