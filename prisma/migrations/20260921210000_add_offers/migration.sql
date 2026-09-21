-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SHARED', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "terms" TEXT,
    "oneTimePriceOre" INTEGER,
    "monthlyPriceOre" INTEGER,
    "includedMonths" INTEGER NOT NULL DEFAULT 6,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "sharedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_clientId_idx" ON "Offer"("clientId");
CREATE INDEX "Offer_status_idx" ON "Offer"("status");
CREATE INDEX "Offer_createdAt_idx" ON "Offer"("createdAt");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
