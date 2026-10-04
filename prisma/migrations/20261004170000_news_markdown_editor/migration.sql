ALTER TABLE "SaasAnnouncement"
  ADD COLUMN "bodyFormat" TEXT NOT NULL DEFAULT 'plain',
  ADD COLUMN "ctaLabel" TEXT,
  ADD COLUMN "ctaUrl" TEXT,
  ADD COLUMN "coverImageUrl" TEXT,
  ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "SaasAnnouncementAsset" (
  "id" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaasAnnouncementAsset_pkey" PRIMARY KEY ("id")
);
