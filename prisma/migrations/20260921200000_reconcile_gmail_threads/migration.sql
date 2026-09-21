-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "gmailMessageId" TEXT,
ADD COLUMN     "inReplyTo" TEXT,
ADD COLUMN     "references" TEXT,
ADD COLUMN     "rfcMessageId" TEXT,
ADD COLUMN     "threadId" TEXT;

-- AlterTable
ALTER TABLE "public"."Settings" ADD COLUMN     "gmailConnectedAt" TIMESTAMP(3),
ADD COLUMN     "gmailHistoryId" TEXT,
ADD COLUMN     "gmailRefreshToken" TEXT,
ADD COLUMN     "gmailWatchExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."Thread" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gmailThreadId" TEXT,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Thread_contactId_idx" ON "public"."Thread"("contactId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Thread_gmailThreadId_key" ON "public"."Thread"("gmailThreadId" ASC);

-- CreateIndex
CREATE INDEX "Thread_updatedAt_idx" ON "public"."Thread"("updatedAt" ASC);

-- CreateIndex
CREATE INDEX "Message_contactId_idx" ON "public"."Message"("contactId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Message_gmailMessageId_key" ON "public"."Message"("gmailMessageId" ASC);

-- CreateIndex
CREATE INDEX "Message_inReplyTo_idx" ON "public"."Message"("inReplyTo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Message_rfcMessageId_key" ON "public"."Message"("rfcMessageId" ASC);

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "public"."Message"("threadId" ASC);

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."Thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Thread" ADD CONSTRAINT "Thread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
