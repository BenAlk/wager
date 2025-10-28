-- Move mileage_rate from work_days to weeks table
-- Mileage rate is typically set per week, not per day, as Amazon adjusts it periodically

-- Add mileage_rate to weeks table
ALTER TABLE weeks
ADD COLUMN IF NOT EXISTS mileage_rate INTEGER;

-- Set default for existing weeks (use the default 19.88p rate)
UPDATE weeks
SET mileage_rate = 1988
WHERE mileage_rate IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE weeks
ALTER COLUMN mileage_rate SET NOT NULL;

-- Remove mileage_rate from work_days table (if it exists in your schema)
-- This column is in the schema but may not have been added yet
-- ALTER TABLE work_days DROP COLUMN IF EXISTS mileage_rate;

COMMENT ON COLUMN weeks.mileage_rate IS 'Mileage rate for this week in pence per 100 miles (e.g., 1988 = 19.88p/mile). Amazon adjusts this based on fuel prices.';
