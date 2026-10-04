-- CreateTable
CREATE TABLE "SaasAnnouncement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'announcement',
  "audiencePlan" "StaarkPlanCode",
  "published" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SaasAnnouncement_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX
  "SaasAnnouncement_published_publishedAt_idx"
ON "SaasAnnouncement"(
  "published",
  "publishedAt"
);

CREATE INDEX
  "SaasAnnouncement_audiencePlan_idx"
ON "SaasAnnouncement"(
  "audiencePlan"
);

CREATE INDEX
  "SaasAnnouncement_createdAt_idx"
ON "SaasAnnouncement"(
  "createdAt"
);
