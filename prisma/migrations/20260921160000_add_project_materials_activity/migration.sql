-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('AWAITING', 'RECEIVED', 'NOT_NEEDED');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('NOTE', 'STATUS_CHANGED', 'TASK_COMPLETED', 'MATERIAL_RECEIVED');

-- CreateTable
CREATE TABLE "ProjectMaterial" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MaterialStatus" NOT NULL DEFAULT 'AWAITING',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectActivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" "ActivityKind" NOT NULL DEFAULT 'NOTE',
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectMaterial_projectId_idx" ON "ProjectMaterial"("projectId");

-- CreateIndex
CREATE INDEX "ProjectActivity_projectId_idx" ON "ProjectActivity"("projectId");

-- CreateIndex
CREATE INDEX "ProjectActivity_createdAt_idx" ON "ProjectActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "ProjectMaterial" ADD CONSTRAINT "ProjectMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectActivity" ADD CONSTRAINT "ProjectActivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

