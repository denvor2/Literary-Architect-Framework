-- Добавить Premium план, если его ещё нет
INSERT INTO "Plan"
  ("id", "name", "tier", "price", "billingPeriodDays", "maxAssistantRequests", "features", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('plan_premium_new', 'Premium', 'premium', 1000, 30, 0,
   ARRAY['unlimited_editing', 'ten_assistants', 'custom_prompts', 'priority_support', 'advanced_analytics'],
   'Неограниченные возможности для авторов', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
