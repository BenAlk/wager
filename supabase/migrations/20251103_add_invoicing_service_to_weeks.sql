-- Add invoicing_service to weeks table
-- This allows each week to remember which invoicing service was used during that week
-- Prevents historical data corruption when user changes service level

-- Add invoicing_service column to weeks table
ALTER TABLE weeks
ADD COLUMN IF NOT EXISTS invoicing_service TEXT;

-- Set default for existing weeks (use Self-Invoicing as safe default)
UPDATE weeks
SET invoicing_service = 'Self-Invoicing'
WHERE invoicing_service IS NULL;

-- Make it NOT NULL after setting defaults
ALTER TABLE weeks
ALTER COLUMN invoicing_service SET NOT NULL;

-- Add check constraint to ensure valid values
ALTER TABLE weeks
ADD CONSTRAINT weeks_invoicing_service_check
CHECK (invoicing_service IN ('Self-Invoicing', 'Verso-Basic', 'Verso-Full'));

COMMENT ON COLUMN weeks.invoicing_service IS 'Snapshot of invoicing service used during this week. Prevents historical data corruption when user changes service level in settings. Values: Self-Invoicing (£0), Verso-Basic (£10), Verso-Full (£30).';
