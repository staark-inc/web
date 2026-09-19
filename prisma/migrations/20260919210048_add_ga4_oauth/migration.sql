-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "ga4ConnectedAt" TIMESTAMP(3),
ADD COLUMN     "ga4RefreshToken" TEXT;
