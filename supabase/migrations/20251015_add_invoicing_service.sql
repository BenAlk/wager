-- Add Invoicing/Accounting Service Options to User Settings
-- Created: 2025-10-15
--
-- Users can choose between:
-- 1. Self-Invoicing (self-employed, no weekly cost)
-- 2. Verso Basic (£10/week - invoicing + public liability insurance)
-- 3. Verso Full (£40/week - invoicing + insurance + full accounting/tax returns)
--
-- Note: Verso requires users to be set up as a Ltd company

-- =====================================================
-- ALTER USER_SETTINGS TABLE
-- =====================================================

ALTER TABLE user_settings
  ADD COLUMN invoicing_service text NOT NULL DEFAULT 'Self-Invoicing'
    CHECK (invoicing_service IN ('Self-Invoicing', 'Verso-Basic', 'Verso-Full'));

-- Add comment for documentation
COMMENT ON COLUMN user_settings.invoicing_service IS
  'Invoicing/accounting service: Self-Invoicing (£0), Verso-Basic (£10/week), Verso-Full (£40/week)';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Default: Self-Invoicing (no weekly cost)
-- Verso-Basic: £10/week (1000 pence) - invoicing + public liability insurance
-- Verso-Full: £40/week (4000 pence) - invoicing + insurance + full accounting
