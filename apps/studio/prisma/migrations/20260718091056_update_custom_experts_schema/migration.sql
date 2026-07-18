/*
  Warnings:

  - You are about to drop the `CustomAssistant` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CustomAssistant" DROP CONSTRAINT "CustomAssistant_userId_fkey";

-- DropTable
DROP TABLE "CustomAssistant";

-- CreateTable
CREATE TABLE "CustomExpert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "typicalRequests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "icon" TEXT NOT NULL DEFAULT '🤖',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicExpert" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "originalId" TEXT,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "typicalRequests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "icon" TEXT NOT NULL DEFAULT '🤖',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicExpert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPublicExpert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPublicExpert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomExpert_userId_idx" ON "CustomExpert"("userId");

-- CreateIndex
CREATE INDEX "CustomExpert_isPublic_deletedAt_idx" ON "CustomExpert"("isPublic", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CustomExpert_userId_name_key" ON "CustomExpert"("userId", "name");

-- CreateIndex
CREATE INDEX "PublicExpert_creatorId_idx" ON "PublicExpert"("creatorId");

-- CreateIndex
CREATE INDEX "UserPublicExpert_userId_idx" ON "UserPublicExpert"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPublicExpert_userId_publicId_key" ON "UserPublicExpert"("userId", "publicId");

-- AddForeignKey
ALTER TABLE "CustomExpert" ADD CONSTRAINT "CustomExpert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPublicExpert" ADD CONSTRAINT "UserPublicExpert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
