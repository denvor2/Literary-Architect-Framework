-- Изменить tier с enum на TEXT, чтобы поддерживать 4 тарифа
ALTER TABLE "Plan" ALTER COLUMN "tier" TYPE TEXT;

-- Удалить старый enum тип
DROP TYPE IF EXISTS "PlanTier" CASCADE;

-- Очистить старые планы
DELETE FROM "Plan";

-- Добавить 4 новых плана
INSERT INTO "Plan"
  ("id", "name", "tier", "price", "billingPeriodDays", "maxAssistantRequests", "features", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('plan_free_001', 'Free', 'free', 0, 30, 100,
   ARRAY['basic_editing', 'one_assistant'],
   'Идеально для начинающих писателей', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_basic_001', 'Basic', 'basic', 300, 30, 300,
   ARRAY['advanced_editing', 'three_assistants', 'custom_prompts'],
   'Для активных авторов с 3 помощниками', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_pro_001', 'Pro', 'pro', 500, 30, 500,
   ARRAY['unlimited_editing', 'five_assistants', 'custom_prompts', 'priority_support'],
   'Профессиональный уровень с 5 помощниками', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_premium_001', 'Premium', 'premium', 1000, 30, 0,
   ARRAY['unlimited_editing', 'ten_assistants', 'custom_prompts', 'priority_support', 'advanced_analytics'],
   'Неограниченные возможности для авторов', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
