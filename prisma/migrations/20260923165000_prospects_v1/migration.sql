-- Prospects v1: local prospect discovery and CRM promotion flow.
CREATE TYPE "ProspectStatus" AS ENUM (
  'NO_WEBSITE',
  'BROKEN_WEBSITE',
  'OLD_WEBSITE',
  'WEAK_WEBSITE',
  'GOOD_WEBSITE',
  'IGNORED',
  'IMPORTED'
);

CREATE TABLE "Prospect" (
  "id" TEXT NOT NULL,
  "placeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT,
  "category" TEXT,
  "address" TEXT,
  "website" TEXT,
  "email" TEXT,
  "websitePhone" TEXT,
  "googlePhone" TEXT,
  "contactPage" TEXT,
  "contactForm" BOOLEAN NOT NULL DEFAULT false,
  "facebook" TEXT,
  "instagram" TEXT,
  "linkedin" TEXT,
  "rating" DOUBLE PRECISION,
  "reviews" INTEGER,
  "status" "ProspectStatus" NOT NULL DEFAULT 'NO_WEBSITE',
  "leadScore" INTEGER NOT NULL DEFAULT 0,
  "websiteScore" INTEGER,
  "reasons" JSONB,
  "https" BOOLEAN,
  "mobile" BOOLEAN,
  "copyrightYear" INTEGER,
  "loadSeconds" DOUBLE PRECISION,
  "pageTitle" TEXT,
  "httpStatus" INTEGER,
  "googleMapsUrl" TEXT,
  "source" TEXT NOT NULL DEFAULT 'google_places',
  "scannedAt" TIMESTAMP(3),
  "importedLeadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Prospect_placeId_key" ON "Prospect"("placeId");
CREATE UNIQUE INDEX "Prospect_importedLeadId_key" ON "Prospect"("importedLeadId");
CREATE INDEX "Prospect_status_idx" ON "Prospect"("status");
CREATE INDEX "Prospect_city_idx" ON "Prospect"("city");
CREATE INDEX "Prospect_category_idx" ON "Prospect"("category");
CREATE INDEX "Prospect_leadScore_idx" ON "Prospect"("leadScore");
CREATE INDEX "Prospect_createdAt_idx" ON "Prospect"("createdAt");

ALTER TABLE "Prospect"
ADD CONSTRAINT "Prospect_importedLeadId_fkey"
FOREIGN KEY ("importedLeadId") REFERENCES "Lead"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
