-- CreateEnum
CREATE TYPE "BillingEnvironment" AS ENUM ('TEST', 'LIVE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "BillingSubscriptionStatus" AS ENUM (
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'SUSPENDED',
  'CANCELING',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'UNPAID',
  'PAUSED'
);

-- CreateTable
CREATE TABLE "BillingCustomer" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "environment" "BillingEnvironment" NOT NULL,
  "stripeCustomerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BillingCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingSubscription" (
  "id" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "billingCustomerId" TEXT NOT NULL,
  "environment" "BillingEnvironment" NOT NULL,
  "stripeSubscriptionId" TEXT NOT NULL,
  "stripePriceId" TEXT NOT NULL,
  "stripeProductId" TEXT,
  "planCode" "StaarkPlanCode" NOT NULL,
  "interval" "BillingInterval" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'sek',
  "unitAmountOre" INTEGER NOT NULL,
  "taxBehavior" TEXT NOT NULL DEFAULT 'exclusive',
  "status" "BillingSubscriptionStatus" NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "trialStart" TIMESTAMP(3),
  "trialEnd" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "entitlements" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingCustomer_stripeCustomerId_key" ON "BillingCustomer"("stripeCustomerId");
CREATE UNIQUE INDEX "BillingCustomer_clientId_environment_key" ON "BillingCustomer"("clientId", "environment");
CREATE INDEX "BillingCustomer_clientId_idx" ON "BillingCustomer"("clientId");
CREATE INDEX "BillingCustomer_environment_idx" ON "BillingCustomer"("environment");

-- CreateIndex
CREATE UNIQUE INDEX "BillingSubscription_stripeSubscriptionId_key" ON "BillingSubscription"("stripeSubscriptionId");
CREATE INDEX "BillingSubscription_clientId_idx" ON "BillingSubscription"("clientId");
CREATE INDEX "BillingSubscription_billingCustomerId_idx" ON "BillingSubscription"("billingCustomerId");
CREATE INDEX "BillingSubscription_environment_idx" ON "BillingSubscription"("environment");
CREATE INDEX "BillingSubscription_planCode_idx" ON "BillingSubscription"("planCode");
CREATE INDEX "BillingSubscription_status_idx" ON "BillingSubscription"("status");
CREATE INDEX "BillingSubscription_currentPeriodEnd_idx" ON "BillingSubscription"("currentPeriodEnd");

-- AddForeignKey
ALTER TABLE "BillingCustomer"
ADD CONSTRAINT "BillingCustomer_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingSubscription"
ADD CONSTRAINT "BillingSubscription_clientId_fkey"
FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingSubscription"
ADD CONSTRAINT "BillingSubscription_billingCustomerId_fkey"
FOREIGN KEY ("billingCustomerId") REFERENCES "BillingCustomer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
