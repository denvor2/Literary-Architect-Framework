-- CreateTable Series
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex Series_userId
CREATE INDEX "Series_userId_idx" ON "Series"("userId");

-- CreateIndex Series_userId_order
CREATE INDEX "Series_userId_order_idx" ON "Series"("userId", "order");

-- AddForeignKey Series_userId
ALTER TABLE "Series" ADD CONSTRAINT "Series_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Book
ALTER TABLE "Book" ADD COLUMN "seriesId" TEXT;

-- CreateIndex Book_seriesId
CREATE INDEX "Book_seriesId_idx" ON "Book"("seriesId");

-- AddForeignKey Book_seriesId
ALTER TABLE "Book" ADD CONSTRAINT "Book_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;
