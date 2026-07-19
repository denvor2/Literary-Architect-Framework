-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSelectedExpertId" TEXT,
ADD COLUMN     "lastSelectedMode" TEXT DEFAULT 'coauthor';
