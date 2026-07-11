-- CreateTable
CREATE TABLE "AssistantSettings" (
    "id" TEXT NOT NULL,
    "mode" "AssistantRole" NOT NULL,
    "displayName" TEXT,
    "promptSuffix" TEXT,
    "typicalRequests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssistantSettings_mode_key" ON "AssistantSettings"("mode");
