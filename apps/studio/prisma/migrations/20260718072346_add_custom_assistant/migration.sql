-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'workspace_updated';

-- CreateTable
CREATE TABLE "CustomAssistant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAssistant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomAssistant_userId_idx" ON "CustomAssistant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomAssistant_userId_name_key" ON "CustomAssistant"("userId", "name");

-- AddForeignKey
ALTER TABLE "CustomAssistant" ADD CONSTRAINT "CustomAssistant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
