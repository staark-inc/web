import {
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { hashIdentifier } from "@/lib/request-security";

export type MfaRateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

async function consume(
  key: string,
  limit: number,
  windowMs: number
): Promise<MfaRateLimitResult> {
  const result = await consumeRateLimit({
    key,
    limit,
    windowMs,
  });

  return {
    allowed: result.allowed,
    retryAfter: result.retryAfter,
  };
}

export async function consumeMfaChallengeLimit(input: {
  userId: string;
  ip: string | null;
}): Promise<MfaRateLimitResult> {
  const globalLimit = await consume(
    "mfa:challenge:global",
    300,
    5 * 60 * 1000
  );

  if (!globalLimit.allowed) return globalLimit;

  const userLimit = await consume(
    `mfa:challenge:user:${hashIdentifier(
      input.userId
    )}`,
    5,
    10 * 60 * 1000
  );

  if (!userLimit.allowed) return userLimit;

  if (input.ip) {
    return consume(
      `mfa:challenge:ip:${hashIdentifier(
        input.ip
      )}`,
      20,
      10 * 60 * 1000
    );
  }

  return { allowed: true, retryAfter: 0 };
}

export async function resetMfaChallengeLimit(
  userId: string
): Promise<void> {
  await resetRateLimit(
    `mfa:challenge:user:${hashIdentifier(userId)}`
  );
}

export function consumeMfaEnrollmentLimit(
  userId: string
): Promise<MfaRateLimitResult> {
  return consume(
    `mfa:enroll:user:${hashIdentifier(userId)}`,
    5,
    60 * 60 * 1000
  );
}

export function consumeMfaActivationLimit(
  userId: string
): Promise<MfaRateLimitResult> {
  return consume(
    `mfa:activate:user:${hashIdentifier(userId)}`,
    10,
    15 * 60 * 1000
  );
}

export function consumeMfaDisableLimit(
  userId: string
): Promise<MfaRateLimitResult> {
  return consume(
    `mfa:disable:user:${hashIdentifier(userId)}`,
    5,
    10 * 60 * 1000
  );
}
