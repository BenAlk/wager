-- Add onboarding tracking to users table
-- This tracks whether users have completed the initial onboarding flow
-- and when they completed it

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether the user has completed the initial onboarding wizard';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when the user completed onboarding';
