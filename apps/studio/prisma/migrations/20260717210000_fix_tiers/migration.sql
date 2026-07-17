-- Исправить tier для Basic плана
UPDATE "Plan" SET "tier" = 'basic' WHERE "name" = 'Basic' AND "tier" = 'premium';

-- Удалить старый неправильный Premium если есть
DELETE FROM "Plan" WHERE "name" = 'Premium' AND "tier" = 'premium' AND "maxAssistantRequests" IS NULL;

-- Создать правильный Premium план
INSERT INTO "Plan"
  ("id", "name", "tier", "price", "billingPeriodDays", "maxAssistantRequests", "features", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('plan_premium_001', 'Premium', 'premium', 1000, 30, 0,
   ARRAY['unlimited_editing', 'ten_assistants', 'custom_prompts', 'priority_support', 'advanced_analytics'],
   'Неограниченные возможности для авторов', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
