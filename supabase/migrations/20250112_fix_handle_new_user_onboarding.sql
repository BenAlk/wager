-- Migration: Update handle_new_user function to initialize onboarding fields
-- This ensures new users get onboarding_completed = FALSE by default

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into users table with onboarding fields
  INSERT INTO public.users (
    id,
    display_name,
    start_week,
    start_year,
    onboarding_completed,
    onboarding_completed_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'),
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

COMMENT ON FUNCTION public.handle_new_user() IS 'Creates user profile and settings when a new auth user is created. Initializes onboarding as incomplete.';
