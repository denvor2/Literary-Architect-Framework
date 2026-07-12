-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "email" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user',
ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Migrate existing single-user to Admin (per ADR-0015 Decision 6)
-- Target the first (earliest-created) user as the existing admin
UPDATE "User" SET email='admin@localhost', role='admin'
WHERE id = (SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1)
  AND (SELECT COUNT(*) FROM "User") >= 1;

-- Enforce email uniqueness and NOT NULL for new users
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
