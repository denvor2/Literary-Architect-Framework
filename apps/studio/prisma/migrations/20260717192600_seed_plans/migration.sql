-- Update PlanTier enum to include 'basic'
ALTER TYPE "PlanTier" ADD VALUE 'basic' BEFORE 'premium';

-- Insert default tariff plans
INSERT INTO "Plan"
  ("id", "name", "tier", "price", "billingPeriodDays", "maxAssistantRequests", "features", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('plan_free_001', 'Free', 'free', 0, 30, 100,
   ARRAY['basic_editing', 'one_assistant'],
   'Get started with Literary Studio', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_basic_001', 'Basic', 'basic', 300, 30, 300,
   ARRAY['advanced_editing', 'three_assistants', 'custom_prompts'],
   'Perfect for active writers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_pro_001', 'Pro', 'pro', 500, 30, 500,
   ARRAY['unlimited_editing', 'five_assistants', 'custom_prompts', 'priority_support'],
   'For serious authors', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  ('plan_premium_001', 'Premium', 'premium', 1000, 30, 0,
   ARRAY['unlimited_editing', 'ten_assistants', 'custom_prompts', 'priority_support', 'advanced_analytics'],
   'Enterprise solutions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
