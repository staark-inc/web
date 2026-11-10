import {
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { hashIdentifier } from "@/lib/request-security";
import { createMfaChallengeToken } from "@/lib/mfa-challenge";
import { createSessionToken } from "@/lib/session";

const LOGIN_GLOBAL_LIMIT = 300;
const LOGIN_GLOBAL_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_IP_LIMIT = 10;
const LOGIN_IP_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ACCOUNT_LIMIT = 5;
const LOGIN_ACCOUNT_WINDOW_MS = 15 * 60 * 1000;

/**
 * A valid bcrypt hash used only to keep the unknown-account path as expensive
 * as the wrong-password path. This reduces account enumeration through timing.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$ohxKBDQEmx2CwkhNJgFEr.rgenDnEgIP5oDGTAv5fjkSnzu.IyOjS";

export type LoginResult =
  | {
      kind: "success";
      user: {
        id: string;
        name: string;
        email: string;
        role: "ADMIN";
      };
      token: string;
    }
  | {
      kind: "mfa_required";
      token: string;
    }
  | {
      kind: "invalid";
    }
  | {
      kind: "rate_limited";
      retryAfter: number;
    };

export async function authenticateLogin(input: {
  email: string;
  password: string;
  ip: string | null;
}): Promise<LoginResult> {
  const email = input.email
    .trim()
    .toLowerCase();

  const globalLimit = await consumeRateLimit({
    key: "login:global",
    limit: LOGIN_GLOBAL_LIMIT,
    windowMs: LOGIN_GLOBAL_WINDOW_MS,
  });

  if (!globalLimit.allowed) {
    return {
      kind: "rate_limited",
      retryAfter: globalLimit.retryAfter,
    };
  }

  if (input.ip) {
    const ipLimit = await consumeRateLimit({
      key: `login:ip:${hashIdentifier(input.ip)}`,
      limit: LOGIN_IP_LIMIT,
      windowMs: LOGIN_IP_WINDOW_MS,
    });

    if (!ipLimit.allowed) {
      return {
        kind: "rate_limited",
        retryAfter: ipLimit.retryAfter,
      };
    }
  }

  const accountKey = `login:account:${hashIdentifier(
    email
  )}`;

  const accountLimit = await consumeRateLimit({
    key: accountKey,
    limit: LOGIN_ACCOUNT_LIMIT,
    windowMs: LOGIN_ACCOUNT_WINDOW_MS,
  });

  if (!accountLimit.allowed) {
    return {
      kind: "rate_limited",
      retryAfter: accountLimit.retryAfter,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      role: true,
      sessionVersion: true,
      disabledAt: true,
      mfaEnabled: true,
    },
  });

  const passwordValid = await verifyPassword(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  if (
    !user ||
    !passwordValid ||
    user.role !== "ADMIN" ||
    user.disabledAt
  ) {
    return {
      kind: "invalid",
    };
  }

  // Successful sign-in should not leave the successful account near its
  // failure ceiling. The IP and global ceilings stay in place.
  try {
    await resetRateLimit(accountKey);
  } catch {
    // The login itself is already authorized; do not turn a cleanup failure
    // into a failed sign-in.
  }

  if (user.mfaEnabled) {
    const token = await createMfaChallengeToken({
      userId: user.id,
      email: user.email,
      sessionVersion: user.sessionVersion,
    });

    return {
      kind: "mfa_required",
      token,
    };
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: "ADMIN",
    sessionVersion: user.sessionVersion,
  });

  return {
    kind: "success",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "ADMIN",
    },
    token,
  };
}
