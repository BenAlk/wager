-- Add language preference to users table
-- Migration: 20260101_add_language_preference
-- Description: Add language_preference column to support multi-language UI

ALTER TABLE users
ADD COLUMN language_preference VARCHAR(5) DEFAULT 'en'
CHECK (language_preference IN ('en', 'pl', 'ro', 'es', 'pt', 'de', 'fr', 'ar', 'bg'));

-- Create index for language preference queries
CREATE INDEX idx_users_language_preference ON users(language_preference);

-- Update existing users to default language
UPDATE users SET language_preference = 'en' WHERE language_preference IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.language_preference IS 'User interface language preference (ISO 639-1 codes)';
