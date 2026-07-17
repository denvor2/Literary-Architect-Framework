-- Insert default tariff plans
INSERT INTO "Plan" 
  ("id", "name", "tier", "price", "billingPeriodDays", "maxAssistantRequests", "features", "description", "isActive", "createdAt", "updatedAt")
VALUES
  ('free_plan_001', 'Free', 'free', 0, 30, 100, 
   ARRAY['basic_editing', 'one_assistant'], 
   'Get started with Literary Studio', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('basic_plan_001', 'Basic', 'premium', 300, 30, 300,
   ARRAY['advanced_editing', 'three_assistants', 'custom_prompts'],
   'Perfect for active writers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('pro_plan_001', 'Pro', 'pro', 500, 30, 500,
   ARRAY['unlimited_editing', 'five_assistants', 'custom_prompts', 'priority_support'],
   'For serious authors', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('premium_plan_001', 'Premium', 'premium', 1000, 30, 0,
   ARRAY['unlimited_editing', 'ten_assistants', 'custom_prompts', 'priority_support', 'advanced_analytics'],
   'Enterprise solutions', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("tier") DO NOTHING;
