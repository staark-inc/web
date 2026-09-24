-- Upgrade the first WordPress connector schema (20260924124500) to the
-- Hub-integrated connector used by WP-05.7.x. Existing paired sites keep
-- their identity and encrypted connector secret.

-- Preserve the legacy AES-GCM payload in a single versioned column. The
-- application can decrypt the legacy format and all new pairings use v1.
ALTER TABLE "WordPressSite" ADD COLUMN "siteSecretEncrypted" TEXT;
UPDATE "WordPressSite"
SET "siteSecretEncrypted" = 'legacy.' || "secretIv" || '.' || "secretTag" || '.' || "secretEncrypted";
ALTER TABLE "WordPressSite" ALTER COLUMN "siteSecretEncrypted" SET NOT NULL;

ALTER TABLE "WordPressSite"
    ADD COLUMN "capabilities" JSONB,
    ADD COLUMN "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "clientId" TEXT,
    ADD COLUMN "projectId" TEXT;

-- The original enum is too restrictive for connector lifecycle states such as
-- REVOKED. Store the state as text while retaining the existing value.
ALTER TABLE "WordPressSite" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "WordPressSite" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "WordPressSite" ALTER COLUMN "status" SET DEFAULT 'CONNECTED';
DROP TYPE "WordPressSiteStatus";

-- These values belonged to the first sync implementation and are superseded
-- by the current signed ping/sync contract.
ALTER TABLE "WordPressSite"
    DROP COLUMN "secretEncrypted",
    DROP COLUMN "secretIv",
    DROP COLUMN "secretTag",
    DROP COLUMN "lastSyncAt",
    DROP COLUMN "lastError";

CREATE INDEX "WordPressSite_clientId_idx" ON "WordPressSite"("clientId");
CREATE INDEX "WordPressSite_projectId_idx" ON "WordPressSite"("projectId");

ALTER TABLE "WordPressSite"
    ADD CONSTRAINT "WordPressSite_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WordPressSite"
    ADD CONSTRAINT "WordPressSite_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Keep legacy one-time pairing rows for audit/history. New fields are populated
-- for newly generated Hub codes; old codes receive harmless legacy metadata.
ALTER TABLE "WordPressPairingCode"
    ADD COLUMN "hint" TEXT,
    ADD COLUMN "targetClientId" TEXT,
    ADD COLUMN "targetProjectId" TEXT,
    ADD COLUMN "createdById" TEXT,
    ADD COLUMN "usedBySiteId" TEXT;

UPDATE "WordPressPairingCode"
SET
    "hint" = 'legacy-' || RIGHT("codeHash", 4),
    "createdById" = 'legacy'
WHERE "hint" IS NULL OR "createdById" IS NULL;

ALTER TABLE "WordPressPairingCode" ALTER COLUMN "hint" SET NOT NULL;
ALTER TABLE "WordPressPairingCode" ALTER COLUMN "createdById" SET NOT NULL;
CREATE INDEX "WordPressPairingCode_usedAt_idx" ON "WordPressPairingCode"("usedAt");

-- The first generic sync table is empty on the development connector and is
-- replaced by an idempotent support-ticket mapping. On a fresh install the two
-- migrations run back-to-back, so it is empty there as well.
DROP TABLE "WordPressSyncRecord";

CREATE TABLE "WordPressTicketSync" (
    "id" TEXT NOT NULL,
    "wordpressSiteId" TEXT NOT NULL,
    "localId" INTEGER NOT NULL,
    "supportRequestId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordPressTicketSync_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WordPressTicketSync_supportRequestId_key" ON "WordPressTicketSync"("supportRequestId");
CREATE UNIQUE INDEX "WordPressTicketSync_wordpressSiteId_localId_key" ON "WordPressTicketSync"("wordpressSiteId", "localId");
CREATE INDEX "WordPressTicketSync_wordpressSiteId_idx" ON "WordPressTicketSync"("wordpressSiteId");
CREATE INDEX "WordPressTicketSync_createdAt_idx" ON "WordPressTicketSync"("createdAt");

ALTER TABLE "WordPressTicketSync"
    ADD CONSTRAINT "WordPressTicketSync_wordpressSiteId_fkey"
    FOREIGN KEY ("wordpressSiteId") REFERENCES "WordPressSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WordPressTicketSync"
    ADD CONSTRAINT "WordPressTicketSync_supportRequestId_fkey"
    FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
