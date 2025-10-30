-- Add mileage_rate to user_settings table
-- This allows users to set their default mileage rate
-- Amazon adjusts this rate periodically based on fuel prices

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS mileage_rate INTEGER NOT NULL DEFAULT 1988; -- 19.88p per mile

COMMENT ON COLUMN user_settings.mileage_rate IS 'Default mileage rate stored as hundredths of a penny (e.g., 1988 = 19.88p/mile = £0.1988/mile). Used when creating new weeks.';
