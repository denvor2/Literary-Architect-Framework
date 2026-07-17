-- Убедиться, что все планы активны
UPDATE "Plan" SET "isActive" = true WHERE "isActive" = false;
