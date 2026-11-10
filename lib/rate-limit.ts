import { prisma } from "@/lib/prisma";

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const CLEANUP_RETENTION_MS = 24 * 60 * 60 * 1000;

let lastCleanupAt = 0;

export type RateLimitResult = {
  allowed: boolean;
  retryAfter: number;
};

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export async function cleanupExpiredRateLimits(
  now = new Date()
): Promise<number> {
  const result =
    await prisma.rateLimitBucket.deleteMany({
      where: {
        resetAt: {
          lt: new Date(
            now.getTime() -
              CLEANUP_RETENTION_MS
          ),
        },
      },
    });

  return result.count;
}

async function maybeCleanup(now: Date) {
  if (
    now.getTime() - lastCleanupAt <
    CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  lastCleanupAt = now.getTime();

  try {
    await cleanupExpiredRateLimits(now);
  } catch {
    // A cleanup failure must not turn a valid request into a 500.
  }
}

/**
 * Atomically consume one slot from a shared bucket.
 *
 * The INSERT ... ON CONFLICT statement is the concurrency boundary, so the
 * same limit is enforced across every application instance and Node process.
 */
export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
}): Promise<RateLimitResult> {
  const now = input.now ?? new Date();
  const resetAt = new Date(
    now.getTime() + input.windowMs
  );

  const rows = await prisma.$queryRaw<
    Array<{
      count: number;
      resetAt: Date | string;
    }>
  >`
    INSERT INTO "RateLimitBucket" (
      "key",
      "count",
      "resetAt",
      "updatedAt"
    )
    VALUES (
      ${input.key},
      1,
      ${resetAt},
      ${now}
    )
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1
        WHEN "RateLimitBucket"."count" > ${input.limit}
          THEN "RateLimitBucket"."count"
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= ${now}
          THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];

  if (!row) {
    throw new Error(
      "Rate limit bucket was not persisted."
    );
  }

  const allowed = row.count <= input.limit;
  const retryAfter = allowed
    ? 0
    : Math.max(
        1,
        Math.ceil(
          (asDate(row.resetAt).getTime() -
            now.getTime()) /
            1000
        )
      );

  await maybeCleanup(now);

  return {
    allowed,
    retryAfter,
  };
}

export async function resetRateLimit(
  key: string
): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({
    where: {
      key,
    },
  });
}
