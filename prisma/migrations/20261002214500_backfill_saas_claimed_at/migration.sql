UPDATE "SaasProvisioning" AS provisioning
SET
  "claimedAt" = claims."usedAt",
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  SELECT
    "provisioningId",
    MIN("usedAt") AS "usedAt"
  FROM "SaasSetupClaim"
  WHERE "usedAt" IS NOT NULL
  GROUP BY "provisioningId"
) AS claims
WHERE provisioning."id" = claims."provisioningId"
  AND provisioning."claimedAt" IS NULL;
