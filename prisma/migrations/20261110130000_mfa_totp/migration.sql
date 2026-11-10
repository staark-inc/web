-- TOTP MFA state, one-time recovery codes and security audit events.
-- Additive only: no existing users, sessions or billing rows are rewritten.
ALTER TABLE "User"
  ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mfaSecretEncrypted" TEXT,
  ADD COLUMN "mfaPendingSecretEncrypted" TEXT,
  ADD COLUMN "mfaPendingExpiresAt" TIMESTAMP(3),
  ADD COLUMN "mfaLastUsedStep" INTEGER;

CREATE TABLE "MfaRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MfaRecoveryCode_codeHash_key"
  ON "MfaRecoveryCode"("codeHash");

CREATE INDEX "MfaRecoveryCode_userId_usedAt_idx"
  ON "MfaRecoveryCode"("userId", "usedAt");

ALTER TABLE "MfaRecoveryCode"
  ADD CONSTRAINT "MfaRecoveryCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SecurityAuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "ipHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecurityAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityAuditEvent_userId_createdAt_idx"
  ON "SecurityAuditEvent"("userId", "createdAt");

CREATE INDEX "SecurityAuditEvent_type_createdAt_idx"
  ON "SecurityAuditEvent"("type", "createdAt");

ALTER TABLE "SecurityAuditEvent"
  ADD CONSTRAINT "SecurityAuditEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
