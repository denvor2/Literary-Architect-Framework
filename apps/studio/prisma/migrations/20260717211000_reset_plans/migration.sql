-- Удалить все планы с неправильными tier'ами
DELETE FROM "Plan" WHERE tier NOT IN ('free', 'pro');

-- Пересоздать корректные планы
INSERT INTO "Plan"
  ("id", "name", "tier", "price", "billingPeriodDays", "maxAssistantRequests", "features", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('plan_free_fixed', 'Free', 'free', 0, 30, 100,
   ARRAY['basic_editing', 'one_assistant'],
   'Идеально для начинающих писателей', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_pro_fixed', 'Pro', 'pro', 500, 30, 500,
   ARRAY['unlimited_editing', 'five_assistants', 'custom_prompts', 'priority_support'],
   'Профессиональный уровень с 5 помощниками', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  description = EXCLUDED.description,
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;
