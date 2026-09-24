-- Staark WordPress Connector
CREATE TYPE "WordPressSiteStatus" AS ENUM ('CONNECTED', 'DISABLED', 'ERROR');

CREATE TABLE "WordPressSite" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "adminUrl" TEXT,
    "wordpressVersion" TEXT,
    "phpVersion" TEXT,
    "hubVersion" TEXT,
    "theme" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "secretEncrypted" TEXT NOT NULL,
    "secretIv" TEXT NOT NULL,
    "secretTag" TEXT NOT NULL,
    "status" "WordPressSiteStatus" NOT NULL DEFAULT 'CONNECTED',
    "lastSeenAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressSite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WordPressPairingCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordPressPairingCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WordPressSyncRecord" (
    "id" TEXT NOT NULL,
    "wordpressSiteId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordPressSyncRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WordPressSite_siteId_key" ON "WordPressSite"("siteId");
CREATE INDEX "WordPressSite_status_idx" ON "WordPressSite"("status");
CREATE INDEX "WordPressSite_siteUrl_idx" ON "WordPressSite"("siteUrl");
CREATE INDEX "WordPressSite_lastSeenAt_idx" ON "WordPressSite"("lastSeenAt");
CREATE UNIQUE INDEX "WordPressPairingCode_codeHash_key" ON "WordPressPairingCode"("codeHash");
CREATE INDEX "WordPressPairingCode_expiresAt_idx" ON "WordPressPairingCode"("expiresAt");
CREATE UNIQUE INDEX "WordPressSyncRecord_wordpressSiteId_entityType_localId_key" ON "WordPressSyncRecord"("wordpressSiteId", "entityType", "localId");
CREATE INDEX "WordPressSyncRecord_remoteId_idx" ON "WordPressSyncRecord"("remoteId");

ALTER TABLE "WordPressSyncRecord"
ADD CONSTRAINT "WordPressSyncRecord_wordpressSiteId_fkey"
FOREIGN KEY ("wordpressSiteId") REFERENCES "WordPressSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
