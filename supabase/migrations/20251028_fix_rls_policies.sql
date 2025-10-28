-- Fix RLS policies for weeks and work_days tables
-- This ensures users can properly query their own data

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own weeks" ON weeks;
DROP POLICY IF EXISTS "Users can insert their own weeks" ON weeks;
DROP POLICY IF EXISTS "Users can update their own weeks" ON weeks;
DROP POLICY IF EXISTS "Users can delete their own weeks" ON weeks;

DROP POLICY IF EXISTS "Users can view their work days" ON work_days;
DROP POLICY IF EXISTS "Users can insert their work days" ON work_days;
DROP POLICY IF EXISTS "Users can update their work days" ON work_days;
DROP POLICY IF EXISTS "Users can delete their work days" ON work_days;

-- Weeks table RLS policies
CREATE POLICY "Users can view their own weeks"
  ON weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weeks"
  ON weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weeks"
  ON weeks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weeks"
  ON weeks FOR DELETE
  USING (auth.uid() = user_id);

-- Work days table RLS policies
-- Work days are owned through the week relationship
CREATE POLICY "Users can view their work days"
  ON work_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their work days"
  ON work_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their work days"
  ON work_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their work days"
  ON work_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );
