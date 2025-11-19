-- Add first_name and last_name to users table
-- These fields are optional (nullable) to support existing users
-- Users can update these through Settings > User Details

ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.first_name IS 'User''s first name (optional, can be set in Settings)';
COMMENT ON COLUMN users.last_name IS 'User''s last name (optional, can be set in Settings)';
