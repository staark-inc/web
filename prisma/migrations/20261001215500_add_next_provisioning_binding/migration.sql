ALTER TABLE "SaasProvisioning"
ADD COLUMN "nextOrganizationId" TEXT,
ADD COLUMN "nextSubscriptionId" TEXT,
ADD COLUMN "nextSiteId" TEXT,
ADD COLUMN "nextSiteKey" TEXT,
ADD COLUMN "nextHostname" TEXT,
ADD COLUMN "nextSiteUrl" TEXT,
ADD COLUMN "nextProvisionedAt" TIMESTAMP(3),
ADD COLUMN "nextSetupExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "SaasProvisioning_nextSiteId_key"
ON "SaasProvisioning"("nextSiteId");

CREATE UNIQUE INDEX "SaasProvisioning_nextSiteKey_key"
ON "SaasProvisioning"("nextSiteKey");

CREATE UNIQUE INDEX "SaasProvisioning_nextHostname_key"
ON "SaasProvisioning"("nextHostname");
