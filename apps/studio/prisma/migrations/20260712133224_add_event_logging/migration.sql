-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('login_success', 'login_failure', 'logout', 'register_success', 'book_created', 'book_updated', 'book_deleted', 'chapter_created', 'chapter_updated', 'chapter_deleted', 'scene_created', 'scene_updated', 'scene_deleted', 'ai_request_line_editor', 'ai_request_critic', 'ai_request_reader', 'ai_request_coauthor', 'subscription_created', 'subscription_updated', 'subscription_expired', 'subscription_cancelled', 'payment_created', 'payment_completed', 'payment_failed');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventArchive" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_eventType_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "Event_userId_eventType_createdAt_idx" ON "Event"("userId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "EventArchive_userId_idx" ON "EventArchive"("userId");

-- CreateIndex
CREATE INDEX "EventArchive_eventType_idx" ON "EventArchive"("eventType");

-- CreateIndex
CREATE INDEX "EventArchive_createdAt_idx" ON "EventArchive"("createdAt");

-- CreateIndex
CREATE INDEX "EventArchive_archivedAt_idx" ON "EventArchive"("archivedAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
