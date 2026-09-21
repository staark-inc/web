-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "threadId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

