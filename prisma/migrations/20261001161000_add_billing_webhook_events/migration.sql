CREATE TABLE "BillingWebhookEvent" (
  "id" TEXT NOT NULL,
  "environment" "BillingEnvironment" NOT NULL,
  "stripeEventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingWebhookEvent_environment_stripeEventId_key"
ON "BillingWebhookEvent"("environment", "stripeEventId");

CREATE INDEX "BillingWebhookEvent_type_idx"
ON "BillingWebhookEvent"("type");

CREATE INDEX "BillingWebhookEvent_createdAt_idx"
ON "BillingWebhookEvent"("createdAt");
