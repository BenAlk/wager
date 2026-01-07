-- Migration: Add LWB route type and update default rates
-- Date: 2026-01-07
-- Purpose: Add new LWB (Long Wheel Base) route type with £171/day rate
--          Update Normal route default from £160 to £157
--          Remove 6-day bonus for weeks after Dec 24, 2024

-- Add LWB to the route_type enum
ALTER TABLE work_days
DROP CONSTRAINT IF EXISTS work_days_route_type_check;

ALTER TABLE work_days
ADD CONSTRAINT work_days_route_type_check
CHECK (route_type IN ('Normal', 'DRS', 'Manual', 'LWB'));

-- Update the default value for normal_rate column
ALTER TABLE user_settings
ALTER COLUMN normal_rate SET DEFAULT 15700;

-- Add LWB rate to user_settings table
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS lwb_rate INTEGER DEFAULT 17100 NOT NULL;

-- Update existing user settings to have the new default rates
UPDATE user_settings
SET normal_rate = 15700  -- Update from £160 to £157
WHERE normal_rate = 16000;

-- Add comments
COMMENT ON COLUMN work_days.route_type IS 'Type of route: Normal (£157), DRS (£100), Manual (custom rate), LWB (£171)';
COMMENT ON COLUMN user_settings.lwb_rate IS 'Default rate for LWB routes in pence (default: £171.00 = 17100)';
