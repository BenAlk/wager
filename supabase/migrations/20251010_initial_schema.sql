-- Wager Database Schema
-- Initial migration: Create all core tables
-- Created: 2025-10-10

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Extends Supabase auth.users with app-specific data
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,                -- Optional: for personalization ("Hey Ben!")
  start_week integer NOT NULL,      -- Week number they joined (1-53)
  start_year integer NOT NULL,      -- Year they joined (e.g., 2025)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. USER SETTINGS TABLE
-- =====================================================
-- Customizable pay rates (stored in pence for precision)
CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  normal_rate integer NOT NULL DEFAULT 16000,    -- £160.00 in pence
  drs_rate integer NOT NULL DEFAULT 10000,       -- £100.00 in pence
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. WEEKS TABLE
-- =====================================================
-- Weekly performance tracking and bonus calculations
CREATE TABLE weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number integer NOT NULL,     -- Week number (1-53)
  year integer NOT NULL,            -- Year (e.g., 2025)

  -- Performance levels (NULL until rankings entered in Week N+1)
  individual_level text CHECK (individual_level IN ('Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+')),
  company_level text CHECK (company_level IN ('Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+')),

  -- Calculated bonus (in pence, calculated when rankings entered)
  bonus_amount integer DEFAULT 0,

  -- User notes for the week
  notes text,

  -- Timestamps
  rankings_entered_at timestamptz,  -- When user entered the rankings
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure one week per user per year
  UNIQUE(user_id, week_number, year)
);

-- =====================================================
-- 4. WORK DAYS TABLE
-- =====================================================
-- Daily work logs (route type, sweeps, rates)
CREATE TABLE work_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  date date NOT NULL,               -- Actual calendar date (e.g., 2025-10-06)

  -- Route information
  route_type text NOT NULL CHECK (route_type IN ('Normal', 'DRS')),
  route_number text,                -- Optional: "DA4-123", "LON-456"
  daily_rate integer NOT NULL,      -- Rate at time of entry (in pence, from user_settings)

  -- Sweep tracking (net calculated on-the-fly: stops_given - stops_taken)
  stops_given integer NOT NULL DEFAULT 0 CHECK (stops_given >= 0),
  stops_taken integer NOT NULL DEFAULT 0 CHECK (stops_taken >= 0),

  -- Notes
  notes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  UNIQUE(week_id, date),
  CHECK (stops_given + stops_taken <= 200)  -- Max 200 total sweeps per day
);

-- =====================================================
-- 5. VAN HIRES TABLE
-- =====================================================
-- Van rental periods with deposit tracking
CREATE TABLE van_hires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Van hire period
  on_hire_date date NOT NULL,
  off_hire_date date,                -- NULL = currently active

  -- Van details
  van_type text CHECK (van_type IN ('Fleet', 'Flexi')),
  registration text NOT NULL,        -- Required: "AB12 CDE" (historical record)
  weekly_rate integer NOT NULL,      -- In pence (e.g., 25000 = £250.00)

  -- Deposit tracking (in pence, cumulative across all van hires)
  deposit_paid integer NOT NULL DEFAULT 0,
  deposit_complete boolean NOT NULL DEFAULT false,

  -- Off-hire refund tracking
  deposit_refunded boolean NOT NULL DEFAULT false,
  deposit_refund_amount integer,     -- Final refund amount (in pence)
  deposit_hold_until date,           -- off_hire_date + 6 weeks

  -- Notes
  notes text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CHECK (deposit_paid >= 0 AND deposit_paid <= 50000),  -- Max £500
  CHECK (off_hire_date IS NULL OR off_hire_date >= on_hire_date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_start_week_year ON users(start_week, start_year);

-- Weeks indexes
CREATE INDEX idx_weeks_user_id ON weeks(user_id);
CREATE INDEX idx_weeks_user_week_year ON weeks(user_id, week_number, year);

-- Work days indexes
CREATE INDEX idx_work_days_week_id ON work_days(week_id);
CREATE INDEX idx_work_days_date ON work_days(date);

-- Van hires indexes
CREATE INDEX idx_van_hires_user_id ON van_hires(user_id);
CREATE INDEX idx_van_hires_active ON van_hires(user_id, off_hire_date) WHERE off_hire_date IS NULL;

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Automatically update updated_at timestamp on row changes

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weeks_updated_at BEFORE UPDATE ON weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_days_updated_at BEFORE UPDATE ON work_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_van_hires_updated_at BEFORE UPDATE ON van_hires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'User accounts with start week/year for historical data boundaries';
COMMENT ON TABLE user_settings IS 'Customizable pay rates per user (stored in pence)';
COMMENT ON TABLE weeks IS 'Weekly performance tracking with bonus calculations';
COMMENT ON TABLE work_days IS 'Daily work logs with route type and sweep tracking';
COMMENT ON TABLE van_hires IS 'Van rental periods with deposit and refund tracking';

COMMENT ON COLUMN user_settings.normal_rate IS 'Normal route daily rate in pence (e.g., 16000 = £160.00)';
COMMENT ON COLUMN user_settings.drs_rate IS 'DRS route daily rate in pence (e.g., 10000 = £100.00)';
COMMENT ON COLUMN weeks.bonus_amount IS 'Performance bonus in pence, paid Week N+8 (6-week delay + 2-week arrears)';
COMMENT ON COLUMN work_days.daily_rate IS 'Snapshot of rate at time of entry for historical accuracy';
COMMENT ON COLUMN van_hires.deposit_paid IS 'Running total of deposit paid across all van hires';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables to ensure users can only access their own data

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE van_hires ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- USER SETTINGS TABLE POLICIES
-- =====================================================

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own settings (during signup)
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- WEEKS TABLE POLICIES
-- =====================================================

-- Users can view their own weeks
CREATE POLICY "Users can view own weeks"
  ON weeks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own weeks
CREATE POLICY "Users can insert own weeks"
  ON weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own weeks
CREATE POLICY "Users can update own weeks"
  ON weeks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own weeks
CREATE POLICY "Users can delete own weeks"
  ON weeks FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- WORK DAYS TABLE POLICIES
-- =====================================================

-- Users can view their own work days
-- (via week_id -> weeks -> user_id chain)
CREATE POLICY "Users can view own work days"
  ON work_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

-- Users can insert their own work days
CREATE POLICY "Users can insert own work days"
  ON work_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

-- Users can update their own work days
CREATE POLICY "Users can update own work days"
  ON work_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

-- Users can delete their own work days
CREATE POLICY "Users can delete own work days"
  ON work_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weeks
      WHERE weeks.id = work_days.week_id
      AND weeks.user_id = auth.uid()
    )
  );

-- =====================================================
-- VAN HIRES TABLE POLICIES
-- =====================================================

-- Users can view their own van hires
CREATE POLICY "Users can view own van hires"
  ON van_hires FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own van hires
CREATE POLICY "Users can insert own van hires"
  ON van_hires FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own van hires
CREATE POLICY "Users can update own van hires"
  ON van_hires FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own van hires
CREATE POLICY "Users can delete own van hires"
  ON van_hires FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- All tables created with RLS policies
-- Users can only access their own data
-- Ready for application development
