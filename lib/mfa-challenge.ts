import { randomUUID } from "node:crypto";

import {
  SignJWT,
  jwtVerify,
} from "jose";

export const MFA_COOKIE = "staark_hub_mfa";
export const MFA_DURATION_SECONDS = 5 * 60;
export const MFA_ISSUER = "staark-inc";
export const MFA_AUDIENCE = "staark-hub-mfa";

export type MfaChallengePayload = {
  userId: string;
  email: string;
  sessionVersion: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

export function mfaCookieOptions(
  secure = process.env.NODE_ENV === "production"
) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MFA_DURATION_SECONDS,
  };
}

export async function createMfaChallengeToken(
  payload: MfaChallengePayload
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    sv: payload.sessionVersion,
    purpose: "mfa",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuer(MFA_ISSUER)
    .setAudience(MFA_AUDIENCE)
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(
      `${MFA_DURATION_SECONDS}s`
    )
    .sign(getSecret());
}

export async function verifyMfaChallengeToken(
  token: string
): Promise<MfaChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ["HS256"],
        issuer: MFA_ISSUER,
        audience: MFA_AUDIENCE,
      }
    );

    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      payload.purpose !== "mfa" ||
      typeof payload.sv !== "number" ||
      !Number.isInteger(payload.sv) ||
      payload.sv < 0
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      sessionVersion: payload.sv,
    };
  } catch {
    return null;
  }
}
