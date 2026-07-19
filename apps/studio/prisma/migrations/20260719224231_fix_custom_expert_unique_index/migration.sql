-- Drop the old non-partial unique index that doesn't account for soft deletes
DROP INDEX IF EXISTS "CustomExpert_userId_name_key";

-- Create a new partial unique index that only considers non-deleted experts
CREATE UNIQUE INDEX "CustomExpert_userId_name_key" ON "CustomExpert"("userId", "name") WHERE "deletedAt" IS NULL;
