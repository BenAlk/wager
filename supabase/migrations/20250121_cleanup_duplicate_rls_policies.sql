-- =====================================================================
-- Cleanup Duplicate RLS Policies and Optimize Performance
-- =====================================================================
-- This migration removes duplicate RLS policies and optimizes existing ones
-- by using (select auth.uid()) to prevent re-evaluation for each row.
--
-- Issues fixed:
-- 1. Duplicate policies (e.g., "Users can view own weeks" + "Users can view their own weeks")
-- 2. Performance: auth.uid() re-evaluation (using subquery wrapper)
-- =====================================================================

-- Drop ALL existing RLS policies (we'll recreate them cleanly)
-- This ensures no duplicates remain

-- USERS table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- USER_SETTINGS table policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;

-- WEEKS table policies (remove ALL duplicates)
DROP POLICY IF EXISTS "Users can view own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can view their own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can insert own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can insert their own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can update own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can update their own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can delete own weeks" ON public.weeks;
DROP POLICY IF EXISTS "Users can delete their own weeks" ON public.weeks;

-- WORK_DAYS table policies (remove ALL duplicates)
DROP POLICY IF EXISTS "Users can view own work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can view their work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can insert own work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can insert their work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can update own work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can update their work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can delete own work days" ON public.work_days;
DROP POLICY IF EXISTS "Users can delete their work days" ON public.work_days;

-- VAN_HIRES table policies
DROP POLICY IF EXISTS "Users can view own van hires" ON public.van_hires;
DROP POLICY IF EXISTS "Users can insert own van hires" ON public.van_hires;
DROP POLICY IF EXISTS "Users can update own van hires" ON public.van_hires;
DROP POLICY IF EXISTS "Users can delete own van hires" ON public.van_hires;

-- =====================================================================
-- Recreate optimized RLS policies (using subquery for performance)
-- =====================================================================

-- USERS table
CREATE POLICY "Users can view their profile"
  ON public.users FOR SELECT
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update their profile"
  ON public.users FOR UPDATE
  USING (id = (select auth.uid()));

CREATE POLICY "Users can delete their profile"
  ON public.users FOR DELETE
  USING (id = (select auth.uid()));

-- USER_SETTINGS table
CREATE POLICY "Users can view their settings"
  ON public.user_settings FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their settings"
  ON public.user_settings FOR UPDATE
  USING (user_id = (select auth.uid()));

-- WEEKS table
CREATE POLICY "Users can view their weeks"
  ON public.weeks FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their weeks"
  ON public.weeks FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their weeks"
  ON public.weeks FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their weeks"
  ON public.weeks FOR DELETE
  USING (user_id = (select auth.uid()));

-- WORK_DAYS table (join through weeks to check ownership)
CREATE POLICY "Users can view their work days"
  ON public.work_days FOR SELECT
  USING (
    week_id IN (
      SELECT id FROM public.weeks WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their work days"
  ON public.work_days FOR INSERT
  WITH CHECK (
    week_id IN (
      SELECT id FROM public.weeks WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their work days"
  ON public.work_days FOR UPDATE
  USING (
    week_id IN (
      SELECT id FROM public.weeks WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their work days"
  ON public.work_days FOR DELETE
  USING (
    week_id IN (
      SELECT id FROM public.weeks WHERE user_id = (select auth.uid())
    )
  );

-- VAN_HIRES table
CREATE POLICY "Users can view their van hires"
  ON public.van_hires FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their van hires"
  ON public.van_hires FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their van hires"
  ON public.van_hires FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their van hires"
  ON public.van_hires FOR DELETE
  USING (user_id = (select auth.uid()));

-- =====================================================================
-- Verify RLS is still enabled on all tables
-- =====================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.van_hires ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Migration complete
-- =====================================================================
-- All duplicate policies removed
-- All policies now use (select auth.uid()) for optimal performance
-- Policy names standardized to "Users can <action> their <resource>"
-- =====================================================================
