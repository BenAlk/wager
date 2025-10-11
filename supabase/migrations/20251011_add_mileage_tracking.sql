-- Migration: Add mileage tracking to work_days
-- Created: 2025-10-11
-- Description: Adds amazon_paid_miles, van_logged_miles, and mileage_rate fields to track mileage payments and discrepancies

-- Add mileage columns to work_days table
ALTER TABLE work_days
ADD COLUMN amazon_paid_miles DECIMAL(6,2) CHECK (amazon_paid_miles >= 0),
ADD COLUMN van_logged_miles DECIMAL(6,2) CHECK (van_logged_miles >= 0),
ADD COLUMN mileage_rate INTEGER DEFAULT 1988 CHECK (mileage_rate >= 0);

-- Add comments for documentation
COMMENT ON COLUMN work_days.amazon_paid_miles IS 'Miles Amazon paid for (stop-to-stop distance from Amazon system)';
COMMENT ON COLUMN work_days.van_logged_miles IS 'Actual miles driven per van odometer (includes travel to/from station, detours)';
COMMENT ON COLUMN work_days.mileage_rate IS 'Pence per 100 miles (default 1988 = £0.1988/mile or 19.88p/mile - Amazon rate)';

-- Note: Mileage payment calculated as: amazon_paid_miles × (mileage_rate / 10000)
-- Note: Example: 85 miles × (1988 / 10000) = 85 × 0.1988 = £16.90
-- Note: Mileage discrepancy calculated as: van_logged_miles - amazon_paid_miles
