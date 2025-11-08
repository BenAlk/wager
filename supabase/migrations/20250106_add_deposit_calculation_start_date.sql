-- Add deposit_calculation_start_date to van_hires table
-- This field stores when automatic deposit tracking should START
-- Used for manual deposit adjustments to avoid double-counting past weeks

ALTER TABLE van_hires
ADD COLUMN deposit_calculation_start_date DATE;

COMMENT ON COLUMN van_hires.deposit_calculation_start_date IS
'Date from which automatic deposit calculations begin. Used with manual deposit adjustments to prevent counting historical weeks twice. NULL means calculate from on_hire_date.';
