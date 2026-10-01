CREATE TABLE "SaasPaymentFailureState" (
  "id" TEXT NOT NULL,
  "billingSubscriptionId" TEXT NOT NULL,
  "firstFailedAt" TIMESTAMP(3) NOT NULL,
  "lastFailedAt" TIMESTAMP(3) NOT NULL,
  "graceEndsAt" TIMESTAMP(3) NOT NULL,
  "lastInvoiceId" TEXT,
  "suspendedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SaasPaymentFailureState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SaasPaymentFailureState_billingSubscriptionId_key"
  ON "SaasPaymentFailureState"("billingSubscriptionId");

CREATE INDEX "SaasPaymentFailureState_graceEndsAt_idx"
  ON "SaasPaymentFailureState"("graceEndsAt");

CREATE INDEX "SaasPaymentFailureState_suspendedAt_idx"
  ON "SaasPaymentFailureState"("suspendedAt");

ALTER TABLE "SaasPaymentFailureState"
  ADD CONSTRAINT "SaasPaymentFailureState_billingSubscriptionId_fkey"
  FOREIGN KEY ("billingSubscriptionId")
  REFERENCES "BillingSubscription"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
