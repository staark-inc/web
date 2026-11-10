-- Add session revocation and account-disable state without changing any
-- existing user rows or billing tables.
ALTER TABLE "User"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "disabledAt" TIMESTAMP(3);

-- Shared, database-backed rate limits. The previous in-memory limiter could
-- not enforce limits across multiple application instances.
CREATE TABLE "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_resetAt_idx"
  ON "RateLimitBucket"("resetAt");
