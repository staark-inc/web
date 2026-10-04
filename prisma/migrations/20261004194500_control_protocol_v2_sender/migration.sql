ALTER TABLE
  "BillingSubscription"
ADD COLUMN
  "runtimeSyncVersion" BIGINT NOT NULL DEFAULT 0;

ALTER TABLE
  "SaasProvisioning"
ADD COLUMN
  "runtimeProvisionVersion" BIGINT NOT NULL DEFAULT 0;
