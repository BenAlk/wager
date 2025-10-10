-- Fix security warning: Set search_path for update_updated_at_column function
-- This addresses the "Function Search Path Mutable" security warning

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- No need to recreate triggers - they automatically use the updated function
