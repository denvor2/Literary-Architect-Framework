-- Fix Premium plan assistants to 4
UPDATE "Plan" SET "maxAssistants" = 4 WHERE "tier" = 'premium';
