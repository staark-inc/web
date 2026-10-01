-- CreateEnum
CREATE TYPE "SaasProvisioningStatus" AS ENUM (
  'PENDING_SETUP',
  'CLAIMED',
  'ACTIVE',
  'FAILED'
);

-- CreateTable
CREATE TABLE "SaasProvisioning" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "billingSubscriptionId" TEXT NOT NULL,
  "environment" "BillingEnvironment" NOT NULL,
  "planCode" "StaarkPlanCode" NOT NULL,
  "entitlements" JSONB NOT NULL,
  "status" "SaasProvisioningStatus" NOT NULL DEFAULT 'PENDING_SETUP',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "claimedAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SaasProvisioning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaasProvisioning_billingSubscriptionId_key"
  ON "SaasProvisioning"("billingSubscriptionId");

-- CreateIndex
CREATE INDEX "SaasProvisioning_clientId_idx"
  ON "SaasProvisioning"("clientId");

-- CreateIndex
CREATE INDEX "SaasProvisioning_environment_idx"
  ON "SaasProvisioning"("environment");

-- CreateIndex
CREATE INDEX "SaasProvisioning_planCode_idx"
  ON "SaasProvisioning"("planCode");

-- CreateIndex
CREATE INDEX "SaasProvisioning_status_idx"
  ON "SaasProvisioning"("status");

-- CreateIndex
CREATE INDEX "SaasProvisioning_requestedAt_idx"
  ON "SaasProvisioning"("requestedAt");

-- AddForeignKey
ALTER TABLE "SaasProvisioning"
  ADD CONSTRAINT "SaasProvisioning_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaasProvisioning"
  ADD CONSTRAINT "SaasProvisioning_billingSubscriptionId_fkey"
  FOREIGN KEY ("billingSubscriptionId") REFERENCES "BillingSubscription"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
