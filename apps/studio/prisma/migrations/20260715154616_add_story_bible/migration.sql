/*
  Warnings:

  - The `genre` column on the `Book` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('outline', 'draft', 'editing', 'beta', 'published');

-- CreateEnum
CREATE TYPE "SeriesStatus" AS ENUM ('outline', 'in_progress', 'complete', 'published');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "bookConstraints" JSONB,
ADD COLUMN     "escalation" TEXT,
ADD COLUMN     "estimatedChapters" INTEGER,
ADD COLUMN     "estimatedWordCount" INTEGER,
ADD COLUMN     "isbn" TEXT,
ADD COLUMN     "mainPlotlines" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "principle" TEXT,
ADD COLUMN     "publishedDate" TIMESTAMP(3),
ADD COLUMN     "status" "BookStatus",
ADD COLUMN     "targetAudience" TEXT,
ADD COLUMN     "themes" JSONB,
ADD COLUMN     "workingTitle" TEXT,
DROP COLUMN "genre",
ADD COLUMN     "genre" JSONB;

-- AlterTable
ALTER TABLE "Series" ADD COLUMN     "author" TEXT,
ADD COLUMN     "decisions" TEXT,
ADD COLUMN     "estimatedTotalWordCount" INTEGER,
ADD COLUMN     "firstPublishedDate" TIMESTAMP(3),
ADD COLUMN     "genre" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "seriesConstraints" JSONB,
ADD COLUMN     "status" "SeriesStatus",
ADD COLUMN     "targetAudience" TEXT,
ADD COLUMN     "throughlineElements" JSONB;
