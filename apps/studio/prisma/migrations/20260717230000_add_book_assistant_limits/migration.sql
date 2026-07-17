-- Добавить поля для ограничений на количество книг и помощников
ALTER TABLE "Plan" ADD COLUMN "maxBooks" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN "maxAssistants" INTEGER NOT NULL DEFAULT 0;

-- Обновить существующие планы с правильными значениями
UPDATE "Plan" SET "maxBooks" = 3 WHERE "name" = 'Free';
UPDATE "Plan" SET "maxBooks" = 10 WHERE "name" = 'Basic';
UPDATE "Plan" SET "maxBooks" = 50 WHERE "name" = 'Pro';
UPDATE "Plan" SET "maxBooks" = 0 WHERE "name" = 'Premium'; -- неограниченно

UPDATE "Plan" SET "maxAssistants" = 1 WHERE "name" = 'Free';
UPDATE "Plan" SET "maxAssistants" = 3 WHERE "name" = 'Basic';
UPDATE "Plan" SET "maxAssistants" = 5 WHERE "name" = 'Pro';
UPDATE "Plan" SET "maxAssistants" = 10 WHERE "name" = 'Premium';
