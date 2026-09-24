CREATE TABLE "WordPressSite" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "siteSecretEncrypted" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "adminUrl" TEXT,
    "wordpressVersion" TEXT,
    "phpVersion" TEXT,
    "hubVersion" TEXT,
    "theme" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "capabilities" JSONB,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT,
    "projectId" TEXT,
    CONSTRAINT "WordPressSite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WordPressPairingCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "targetClientId" TEXT,
    "targetProjectId" TEXT,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedBySiteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordPressPairingCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WordPressTicketSync" (
    "id" TEXT NOT NULL,
    "wordpressSiteId" TEXT NOT NULL,
    "localId" INTEGER NOT NULL,
    "supportRequestId" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WordPressTicketSync_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WordPressSite_siteId_key" ON "WordPressSite"("siteId");
CREATE INDEX "WordPressSite_clientId_idx" ON "WordPressSite"("clientId");
CREATE INDEX "WordPressSite_projectId_idx" ON "WordPressSite"("projectId");
CREATE INDEX "WordPressSite_status_idx" ON "WordPressSite"("status");
CREATE INDEX "WordPressSite_lastSeenAt_idx" ON "WordPressSite"("lastSeenAt");

CREATE UNIQUE INDEX "WordPressPairingCode_codeHash_key" ON "WordPressPairingCode"("codeHash");
CREATE INDEX "WordPressPairingCode_expiresAt_idx" ON "WordPressPairingCode"("expiresAt");
CREATE INDEX "WordPressPairingCode_usedAt_idx" ON "WordPressPairingCode"("usedAt");

CREATE UNIQUE INDEX "WordPressTicketSync_supportRequestId_key" ON "WordPressTicketSync"("supportRequestId");
CREATE UNIQUE INDEX "WordPressTicketSync_wordpressSiteId_localId_key" ON "WordPressTicketSync"("wordpressSiteId", "localId");
CREATE INDEX "WordPressTicketSync_wordpressSiteId_idx" ON "WordPressTicketSync"("wordpressSiteId");
CREATE INDEX "WordPressTicketSync_createdAt_idx" ON "WordPressTicketSync"("createdAt");

ALTER TABLE "WordPressSite" ADD CONSTRAINT "WordPressSite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WordPressSite" ADD CONSTRAINT "WordPressSite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WordPressTicketSync" ADD CONSTRAINT "WordPressTicketSync_wordpressSiteId_fkey" FOREIGN KEY ("wordpressSiteId") REFERENCES "WordPressSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WordPressTicketSync" ADD CONSTRAINT "WordPressTicketSync_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
