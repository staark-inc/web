import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  authorizeSessionToken,
  createSessionToken,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/session";

export {
  SESSION_COOKIE,
  SESSION_DURATION,
  authorizeSessionToken,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
  type SessionPayload,
  type SessionTokenPayload,
} from "@/lib/session";

export {
  hashPassword,
  verifyPassword,
} from "@/lib/passwords";

/**
 * Salveaza sesiunea intr-un cookie HttpOnly.
 */
export async function createSession(
  payload: SessionPayload
) {
  const token = await createSessionToken(payload);

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE,
    token,
    sessionCookieOptions()
  );
}

/**
 * Returneaza sesiunea curenta.
 *
 * Verify the JWT and the current user row so privileged routes cannot keep
 * accepting a cookie after a password change, identity change, disable or
 * deletion.
 */
export async function getSession(): Promise<
  SessionPayload | null
> {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE
  )?.value;

  if (!token) {
    return null;
  }

  return authorizeSessionToken(token);
}

/**
 * Sterge sesiunea la logout.
 */
export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
