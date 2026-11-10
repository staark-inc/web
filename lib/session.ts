import { SignJWT, jwtVerify } from "jose";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "staark_hub_session";

export const SESSION_DURATION = 60 * 60 * 24 * 7;

export type SessionPayload = {
  userId: string;
  email: string;
  role: "ADMIN";
  sessionVersion: number;
};

export type SessionTokenPayload = Omit<
  SessionPayload,
  "sessionVersion"
> & {
  /**
   * Older tokens do not carry a version. They are accepted only while the
   * account is still at version 0, then invalidated by any security event.
   */
  sessionVersion: number | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export function sessionCookieOptions(
  secure = process.env.NODE_ENV === "production"
) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION,
  };
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    sv: payload.sessionVersion,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      payload.role !== "ADMIN"
    ) {
      return null;
    }

    let sessionVersion: number | null = null;

    if (payload.sv !== undefined) {
      if (
        typeof payload.sv !== "number" ||
        !Number.isInteger(payload.sv) ||
        payload.sv < 0
      ) {
        return null;
      }

      sessionVersion = payload.sv;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: "ADMIN",
      sessionVersion,
    };
  } catch {
    return null;
  }
}

/**
 * Verify a JWT and then re-check the account in the database.
 *
 * This is the canonical authorization check for privileged Hub routes. A
 * token is rejected after a password/identity rotation, account disable or
 * account deletion even when its signature and expiry are still valid.
 */
export async function authorizeSessionToken(
  token: string
): Promise<SessionPayload | null> {
  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      sessionVersion: true,
      disabledAt: true,
    },
  });

  if (
    !user ||
    user.role !== "ADMIN" ||
    user.disabledAt ||
    payload.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return null;
  }

  const tokenVersion = payload.sessionVersion ?? 0;

  if (tokenVersion !== user.sessionVersion) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: "ADMIN",
    sessionVersion: user.sessionVersion,
  };
}
