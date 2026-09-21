CREATE TYPE "SupportCategory" AS ENUM (
  'WEBSITE',
  'HOSTING',
  'EMAIL',
  'BUG',
  'CHANGE',
  'OTHER'
);

CREATE TYPE "SupportPriority" AS ENUM (
  'NORMAL',
  'URGENT'
);

ALTER TABLE "SupportRequest"
ALTER COLUMN "clientId" DROP NOT NULL,
ADD COLUMN "reference" TEXT,
ADD COLUMN "requesterName" TEXT,
ADD COLUMN "requesterEmail" TEXT,
ADD COLUMN "requesterCompany" TEXT,
ADD COLUMN "requesterWebsite" TEXT,
ADD COLUMN "category" "SupportCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL';

CREATE UNIQUE INDEX "SupportRequest_reference_key"
ON "SupportRequest"("reference");

CREATE INDEX "SupportRequest_requesterEmail_idx"
ON "SupportRequest"("requesterEmail");
