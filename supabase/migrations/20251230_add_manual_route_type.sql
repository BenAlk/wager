-- Migration: Add 'Manual' route type option
-- Date: 2025-12-30
-- Description: Allows users to enter custom daily rates for special routes (LWB, 9.5hr, etc.)

-- Update route_type constraint to include 'Manual' option
ALTER TABLE work_days
  DROP CONSTRAINT IF EXISTS work_days_route_type_check;

ALTER TABLE work_days
  ADD CONSTRAINT work_days_route_type_check
  CHECK (route_type IN ('Normal', 'DRS', 'Manual'));

-- Add comment explaining Manual route type
COMMENT ON COLUMN work_days.route_type IS
  'Route type: Normal (£160 default), DRS (£100 default), or Manual (custom rate entered by user for special routes like LWB, 9.5hr, etc.)';

-- Note: The daily_rate column already exists and stores the rate in pence
-- No schema changes needed - just updating the constraint to allow 'Manual' as a valid value
