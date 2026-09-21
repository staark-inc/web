-- AlterEnum
-- Adds two non-destructive values to ProjectStatus.
-- PostgreSQL 12+ allows several ADD VALUE statements in one migration.

ALTER TYPE "ProjectStatus" ADD VALUE 'REVIEW';
ALTER TYPE "ProjectStatus" ADD VALUE 'MAINTENANCE';
