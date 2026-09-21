ALTER TYPE "OfferStatus"
ADD VALUE IF NOT EXISTS 'VIEWED';

ALTER TABLE "Offer"
ADD COLUMN "shareToken" TEXT,
ADD COLUMN "viewedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX
"Offer_shareToken_key"
ON "Offer"("shareToken");
