-- CreateEnum
CREATE TYPE "StaarkPlanCode" AS ENUM ('STARTER', 'SAAS', 'BUSINESS');

-- AlterTable
ALTER TABLE "Client"
ADD COLUMN "saasPlanCode" "StaarkPlanCode",
ADD COLUMN "saasEntitlements" JSONB;

-- CreateIndex
CREATE INDEX "Client_saasPlanCode_idx" ON "Client"("saasPlanCode");
