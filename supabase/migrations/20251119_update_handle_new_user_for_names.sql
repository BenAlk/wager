-- Migration: Update handle_new_user function to include first_name and last_name
-- This ensures new users can save their first and last names during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table with all fields including first_name and last_name
  INSERT INTO public.users (
    id,
    display_name,
    first_name,
    last_name,
    start_week,
    start_year,
    onboarding_completed,
    onboarding_completed_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
    NEW.raw_user_meta_data->>'first_name',  -- NULL if not provided
    NEW.raw_user_meta_data->>'last_name',   -- NULL if not provided
    COALESCE((NEW.raw_user_meta_data->>'start_week')::integer, 1),
    COALESCE((NEW.raw_user_meta_data->>'start_year')::integer, EXTRACT(YEAR FROM NOW())::integer),
    FALSE,  -- Always start with onboarding not completed
    NULL    -- No completion timestamp yet
  );

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id, normal_rate, drs_rate)
  VALUES (NEW.id, 16000, 10000);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and settings when a new auth user is created. Includes first_name and last_name fields.';
