-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'FACEBOOK');

-- AlterTable
ALTER TABLE "Contact"
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN "facebook" TEXT;

-- AlterTable
ALTER TABLE "Lead"
  ADD COLUMN "contactChannel" "ContactChannel" NOT NULL DEFAULT 'EMAIL';

-- Existing leads were created from email-based CRM flows.
UPDATE "Lead" SET "contactChannel" = 'EMAIL' WHERE "contactChannel" IS NULL;

-- CreateIndex
CREATE INDEX "Contact_phone_idx" ON "Contact"("phone");
CREATE INDEX "Contact_facebook_idx" ON "Contact"("facebook");
CREATE INDEX "Lead_contactChannel_idx" ON "Lead"("contactChannel");
