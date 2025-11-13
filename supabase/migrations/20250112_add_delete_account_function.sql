-- Migration: Add delete_user_account function
-- This function safely deletes all user data and their auth account

-- Create function to delete user account and all related data
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get the current user's ID
  user_uuid := auth.uid();

  -- Verify user is authenticated
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete all user data in order (some will cascade, but being explicit)
  -- These will cascade delete due to foreign key constraints, but we'll be explicit

  -- 1. Delete work_days (will cascade from weeks, but let's be explicit)
  DELETE FROM work_days
  WHERE week_id IN (SELECT id FROM weeks WHERE user_id = user_uuid);

  -- 2. Delete weeks
  DELETE FROM weeks WHERE user_id = user_uuid;

  -- 3. Delete van hires
  DELETE FROM van_hires WHERE user_id = user_uuid;

  -- 4. Delete user settings
  DELETE FROM user_settings WHERE user_id = user_uuid;

  -- 5. Delete user profile
  DELETE FROM users WHERE id = user_uuid;

  -- 6. Delete auth user (this is the critical step)
  -- This uses Supabase's auth.users table
  DELETE FROM auth.users WHERE id = user_uuid;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_account() IS 'Permanently deletes the calling user account and all associated data. This action is irreversible.';
