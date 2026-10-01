CREATE TABLE "SaasSetupClaim" (
    "id" TEXT NOT NULL,
    "provisioningId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaasSetupClaim_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaasSetupClaim_tokenHash_key" ON "SaasSetupClaim"("tokenHash");
CREATE INDEX "SaasSetupClaim_provisioningId_idx" ON "SaasSetupClaim"("provisioningId");
CREATE INDEX "SaasSetupClaim_expiresAt_idx" ON "SaasSetupClaim"("expiresAt");
CREATE INDEX "SaasSetupClaim_usedAt_idx" ON "SaasSetupClaim"("usedAt");
CREATE INDEX "SaasSetupClaim_revokedAt_idx" ON "SaasSetupClaim"("revokedAt");

ALTER TABLE "SaasSetupClaim"
ADD CONSTRAINT "SaasSetupClaim_provisioningId_fkey"
FOREIGN KEY ("provisioningId") REFERENCES "SaasProvisioning"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
