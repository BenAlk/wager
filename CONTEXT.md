# Wager - Project Context & Design Decisions

## Project Origin

This app is being built by a courier who works for a DSP (Delivery Service Partner) that works for Amazon. The primary goal is to accurately track weekly pay and predict future earnings, which is complex due to multiple variables and delayed bonuses.

## The Problem

Courier pay is difficult to track manually because:

- Different daily rates depending on days worked that week
- Bonuses are delayed by 6 weeks and rankings revealed 1 week after work
- Multiple bonus tier combinations
- Sweep adjustments from helping other drivers (tracked daily)
- Van rental costs with complex deposit structures
- Pro-rata calculations for partial week van hires
- Off-boarding deposit refunds with 6-week holding period

The app solves this by automating all calculations and providing visibility into current and future pay.

## Key Business Rules

### Pay Rates

- **Normal Route**: £160/day (default, customizable in settings)
- **DRS/Missort Route**: £100/day (default, customizable in settings)
  - DRS = Cleanup parcels that didn't make it into correct bags in time (not area-specific, smaller routes)
- **6-Day Week Bonus**: Flat £30 bonus (6 days × £5/day) added to weekly pay when working exactly 6 days
  - Applied as separate line item, not baked into daily rate
  - Works with ANY route type combination (6 Normal, 6 DRS, or mixed)
  - Paid with standard pay in Week N+2 (part of base pay, NOT delayed like performance bonus)
  - Example: 6 days of Normal routes = (6 × £160) + £30 = £990 total base pay
  - Example: 6 days of DRS routes = (6 × £100) + £30 = £630 total base pay
  - Example: 4 Normal + 2 DRS = (4 × £160) + (2 × £100) + £30 = £870 total base pay
- **Hard Constraint**: Cannot work 7 days in a single week (ILLEGAL - hard block in UI)

### Invoicing & Accounting Services

Users can choose between self-invoicing or using Verso (requires Ltd company setup):

- **Self-Invoicing**: £0/week
  - Default option for self-employed couriers
  - User handles their own invoicing and tax returns
  - No weekly deduction from pay

- **Verso Basic**: £10/week (1000 pence)
  - Invoicing service
  - Public liability insurance included
  - Requires Ltd company setup
  - Deducted from weekly standard pay (Week N+2)

- **Verso Full**: £40/week (4000 pence)
  - Full invoicing service
  - Public liability insurance included
  - Complete accounting and tax returns handled
  - Requires Ltd company setup
  - Deducted from weekly standard pay (Week N+2)

### Mileage Tracking

- **Amazon Paid Mileage**: Stop-to-stop distance calculated by Amazon, paid at Amazon's rate
  - Amazon rate: £0.1988 per mile (19.88 pence per mile)
  - Paid with standard pay (Week N+2)
  - User enters mileage amount shown on Amazon pay breakdown
- **Van Logged Mileage**: Actual odometer reading from the van
  - Shows real distance driven (includes travel to/from station, detours, etc.)
  - User enters start/end odometer readings OR total miles driven
  - Optional field for tracking purposes
- **Mileage Discrepancy**: Difference between van logged and Amazon paid mileage
  - Shows where courier is losing money (fuel costs without compensation)
  - Formula: `(van_logged_miles - amazon_paid_miles) × £0.1988 = money_lost_on_fuel`
  - Displayed as warning/info in daily breakdown
- **Example**:
  - Amazon paid mileage: 85 miles × £0.1988 = £16.90
  - Van logged mileage: 98 miles
  - Discrepancy: 13 miles × £0.1988 = £2.58 lost on unpaid fuel costs

### Pay Timing

- **Standard Pay** (base + 6-day bonus + sweeps + mileage - van costs): Paid **2 weeks in arrears** (Week N work paid in Week N+2)
- **Performance Bonus**: Paid **6 weeks after work** (Week N work, bonus received in Week N+6)
  - The bonus arrives in the same payment as Week N+4 standard pay (both received in Week N+6)
- **Example Timeline**:
  - Week 32: Work 6 days, eligible for performance bonus
  - Week 33 (Thursday): Rankings released, enter performance levels
  - Week 34: Receive standard pay for Week 32 (base + 6-day bonus + sweeps + mileage - van costs)
  - Week 38: Receive payment containing Week 36 standard pay + Week 32 performance bonus

### Bonus System

**Performance Levels** (both Individual and Company):

1. Poor (no pay)
2. Fair (no pay)
3. Great (no pay)
4. Fantastic (payable)
5. Fantastic+ (payable)

**Bonus Tiers**:

- Individual Fantastic+ AND Company Fantastic+ = £12/day
- Individual Fantastic+ AND Company Fantastic = £8/day
- Individual Fantastic AND Company Fantastic+ = £8/day
- All other combinations = £0/day

**Critical Timing Rules**:

- **Rankings revealed**: Usually Thursday of Week N+1, but can be delayed 1-2 days
- **Performance bonus paid**: 6 weeks after work (Week N work, bonus received in Week N+6)
  - Week N+6 payment includes: Week N+4 standard pay + Week N performance bonus
- **Reminder system**: App should remind users to enter rankings for accurate pay prediction (not strict Thursday-only)
- **Retroactive entry**: Allow users to enter rankings late, system auto-recalculates
- **Example Timeline**:
  - Week 39: Work 6 days (Monday-Saturday)
  - Week 40 (Thursday-ish): Rankings released → Input: Individual Fantastic+, Company Fantastic
  - System calculates: 6 days × £8/day = £48 bonus
  - Week 41: Receive standard pay for Week 39 (base + 6-day bonus + sweeps + mileage - van)
  - Week 45: Receive payment containing Week 43 standard pay + £48 performance bonus from Week 39

**Bonus Calculation**: Per day worked (calculated when rankings entered)

- If you worked 6 days in Week 39 and earned Fantastic+/Fantastic → 6 × £8 = £48 bonus received in Week 45

### Sweeping

- Sweeping = taking stops from drivers who are behind schedule
- **+£1 per stop** you take from someone else
- **-£1 per stop** someone takes from you
- **Tracked daily**, calculated weekly, paid with that week's standard pay (Week N+2)
- **Max 200 sweeps per day** (total: stops_given + stops_taken combined, sanity check)
- Example:
  - Monday: +12 stops given, -3 stops taken
  - Tuesday: +8 stops given, -0 stops taken
  - Weekly total: +45 given, -7 taken = net +38 stops = **+£38**

### Van Hire

**Van Rates**:

- **Standard fleet vans**: £250/week (default)
- **Flexi vans**: £100-£250/week (company-owned, not fleet)
- **Customization**: User can set custom rate per van hire in settings (not a global setting)

**Van Hire Rules**:

- Users cannot have multiple simultaneous van hires
- When switching vans: Off-hire current van, then on-hire new van
- **Deposits carry over** between sequential van hires
  - Example: Paid £300 deposit on Van A, switch to Van B → Only owe £200 more on Van B
  - No separate deposits per van - one cumulative £500 deposit total across all van hires

**Deposit Structure (During Employment)**:

- First 2 weeks: £25/week toward deposit
- After 2 weeks: £50/week toward deposit
- Total deposit required: £500
- Once £500 paid, only weekly rate applies

**Off-boarding Process**:

1. Courier gives notice / last day worked
2. Van returned on off-hire date
3. Company calculates deposit shortfall: `£500 - deposit_paid_so_far`
4. Final paycheck is reduced by shortfall amount (only what's available)
   - Example: £200 shortfall, but final pay is £150 → Company takes £150, chases remaining £50 if damage exceeds
5. Full £500 deposit held for 6 weeks from off-hire date
6. After 6 weeks:
   - If no fines/damage → Full £500 refunded
   - If fines/damage → £500 minus deductions refunded

**On-Hire/Off-Hire Pro-rata**:

- **On-hire**: Date you take possession of van
- **Off-hire**: Date you return van
- **Pro-rata calculation**: Pay only for days you had the van
  - Example: Take van on Wednesday (day 4 of week) → Pay (£250 / 7) × 4 days
  - Example: Return van on Friday (5 days used) → Pay (£250 / 7) × 5 days

### Week Structure ✅ **IMPLEMENTED** (TBC - Awaiting Manager Confirmation)

**Current Implementation** (subject to change based on manager feedback):

- Weeks run **Sunday to Saturday** (NOT Monday-Sunday)
- Week numbers follow a **52-week year starting in late December** (NOT ISO 8601, NOT calendar weeks)
- **Week 1 Start Rule**: Week 1 starts on the Sunday following the end of the previous work year (typically the last Sunday of December, between Dec 24-31)
- **Week 53 Rule**: Week 53 exists ONLY if:
  1. Week 52 ends on December 24th or earlier, AND
  2. A full Sunday-Saturday week can fit ending on/before December 31st
- **2024-2030 Examples**:
  - 2024-2025: Week 1 = Dec 29, 2024 | Week 52 = Dec 27, 2025 | No Week 53
  - 2025-2026: Week 1 = Dec 28, 2025 | Week 52 = Dec 26, 2026 | No Week 53
  - 2026-2027: Week 1 = Dec 27, 2026 | Week 52 = Dec 25, 2027 | No Week 53
  - 2027-2028: Week 1 = Dec 26, 2027 | Week 52 = Dec 23, 2028 | **Week 53 = Dec 24-30, 2028** ✅
  - 2028-2029: Week 1 = Dec 31, 2028 | Week 52 = Dec 29, 2029 | No Week 53
  - 2029-2030: Week 1 = Dec 30, 2029 | Week 52 = Dec 28, 2030 | No Week 53
- **Week 53 Frequency**: Approximately every 5-6 years
- **Implementation**: Custom calculation in `src/lib/dates.ts` with full test coverage (40 passing tests)
- **Status**: Fully functional and ready for use. If manager confirms different rules, can be easily updated in one file.

### Historical Data Policy

- **No historical weeks by default**: Users signing up in Week 50 do NOT see Weeks 1-49 in UI
  - Start week automatically set to current week at signup
  - Cannot log work for weeks before signup
- **Bonus eligibility delay**:
  - User can enter rankings for early weeks (Week 50-55)
  - But £0 bonus shown until Week 56 (6 weeks after Week 50)
  - First bonus payment: Week 56 for Week 50 work
- **Pay timeline for new user (signs up Week 50)**:
  - Week 50: Work logged
  - Week 51 (Thursday-ish): Enter Week 50 rankings
  - Week 52: Receive standard pay for Week 50 (2-week arrears)
  - Week 58: Receive Week 56 standard pay + Week 50 performance bonus
- **Future Feature**: Historical data backfill - manual entry in settings (TBC, not MVP)

## Design Decisions

### Why Supabase?

- **Multi-user requirement**: Other team members will use the app
- **Easy auth**: Built-in authentication system
- **Real-time**: Can add live features later
- **Free tier**: Generous for MVP
- **PostgreSQL**: Proper relational database for complex calculations
- **Row Level Security**: Each user's data is private

### Why pnpm?

- Fastest package manager
- Most disk-efficient (important for developers with multiple projects)
- Modern standard
- Better dependency management

### Why Zustand over Redux?

- Simpler API
- Less boilerplate
- Smaller bundle size
- Perfect for this app's complexity level

### Why date-fns over Moment.js?

- Lightweight
- Tree-shakeable
- Modern and actively maintained
- Immutable by default

### Folder Structure Philosophy

- **`components/`**: Presentational components organized by feature area
- **`features/`**: Business logic and feature-specific code
- **`lib/`**: Shared utilities and external service configs
- **`store/`**: Global state management
- **`types/`**: TypeScript definitions
- **`pages/`**: Route-level components

## Database Schema

### ✅ Implemented Tables (Live in Supabase)

**All currency values stored in pence (integers) for precision**

```typescript
users {
  id: uuid (PK, references auth.users)
  display_name: text | null              // Optional: "Hey Ben!" personalization
  start_week: integer NOT NULL           // Week they joined app (1-53)
  start_year: integer NOT NULL           // Year they joined (e.g., 2025)
  created_at: timestamptz
  updated_at: timestamptz                // Auto-updated via trigger

  // RLS: Users can only access their own profile
}

user_settings {
  user_id: uuid (PK, FK → users)
  normal_rate: integer DEFAULT 16000     // £160.00 in pence
  drs_rate: integer DEFAULT 10000        // £100.00 in pence
  invoicing_service: text DEFAULT 'Self-Invoicing'  // 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
  created_at: timestamptz
  updated_at: timestamptz                // Auto-updated via trigger

  // Note: 6-day bonus (£30) is calculated, not stored
  // Note: Invoicing costs: Self-Invoicing (£0), Verso-Basic (£10), Verso-Full (£40)
  // RLS: Users can only access their own settings
}

weeks {
  id: uuid (PK)
  user_id: uuid (FK → users)
  week_number: integer NOT NULL          // Week number (1-53)
  year: integer NOT NULL                 // Year (e.g., 2025)
  individual_level: text | null          // 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+'
  company_level: text | null             // 'Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+'
  bonus_amount: integer DEFAULT 0        // In pence, calculated when rankings entered
  notes: text | null                     // User notes for the week
  rankings_entered_at: timestamptz | null
  created_at: timestamptz
  updated_at: timestamptz                // Auto-updated via trigger

  UNIQUE(user_id, week_number, year)    // One week per user per year
  // Note: bonus_paid_in_week calculated as: week_number + 6 (on-the-fly)
  // RLS: Users can only access their own weeks
}

work_days {
  id: uuid (PK)
  week_id: uuid (FK → weeks)
  date: date NOT NULL                    // Calendar date (e.g., '2025-10-10')
  route_type: text NOT NULL              // 'Normal' | 'DRS'
  route_number: text | null              // Optional: "DA4-123"
  daily_rate: integer NOT NULL           // In pence, snapshot from user_settings
  stops_given: integer DEFAULT 0         // >= 0
  stops_taken: integer DEFAULT 0         // >= 0
  amazon_paid_miles: decimal(6,2) | null // Miles Amazon paid for (stop-to-stop)
  van_logged_miles: decimal(6,2) | null  // Actual van odometer miles driven
  mileage_rate: integer DEFAULT 1988     // Pence per 100 miles (1988 = £0.1988/mile or 19.88p/mile)
  notes: text | null                     // Daily notes
  created_at: timestamptz
  updated_at: timestamptz                // Auto-updated via trigger

  UNIQUE(week_id, date)                  // One entry per date per week
  CHECK(stops_given >= 0)
  CHECK(stops_taken >= 0)
  CHECK(stops_given + stops_taken <= 200) // Max 200 total sweeps
  CHECK(amazon_paid_miles >= 0)
  CHECK(van_logged_miles >= 0)
  CHECK(mileage_rate >= 0)
  // Note: Net sweeps calculated as: stops_given - stops_taken (on-the-fly)
  // Note: Mileage pay calculated as: amazon_paid_miles × (mileage_rate / 10000) (on-the-fly, divide by 10000 to convert to £)
  // Note: Mileage discrepancy calculated as: van_logged_miles - amazon_paid_miles (on-the-fly)
  // RLS: Users can only access work_days via their weeks
}

van_hires {
  id: uuid (PK)
  user_id: uuid (FK → users)
  on_hire_date: date NOT NULL
  off_hire_date: date | null             // NULL = currently active
  van_type: text | null                  // 'Fleet' | 'Flexi'
  registration: text NOT NULL            // Required: "AB12 CDE"
  weekly_rate: integer NOT NULL          // In pence (e.g., 25000 = £250.00)
  deposit_paid: integer DEFAULT 0        // Running total, cumulative across all hires
  deposit_complete: boolean DEFAULT false
  deposit_refunded: boolean DEFAULT false
  deposit_refund_amount: integer | null  // In pence
  deposit_hold_until: date | null        // off_hire_date + 6 weeks
  notes: text | null
  created_at: timestamptz
  updated_at: timestamptz                // Auto-updated via trigger

  CHECK(deposit_paid >= 0 AND deposit_paid <= 50000)  // Max £500
  CHECK(off_hire_date IS NULL OR off_hire_date >= on_hire_date)
  // Note: Total deposit across all hires calculated as: SUM(deposit_paid) (on-the-fly)
  // RLS: Users can only access their own van hires
}
```

**Migration File:** `supabase/migrations/20251010_initial_schema.sql`
**TypeScript Types:** `src/types/database.ts` (auto-generated)
**Security:** All tables have RLS enabled with user-specific policies
**Performance:** Indexes on user_id, week_number, date, and active van hires

## Critical Calculations

### 6-Day Week Bonus Calculation

```typescript
// Calculate base pay using standard rates
const base_pay = work_days.reduce((sum, day) => {
	const rate = day.route_type === 'Normal' ? normalRate : drsRate
	return sum + rate
}, 0)

// Add flat £30 bonus if worked exactly 6 days
const six_day_bonus = work_days.length === 6 ? 30 : 0 // 6 * £5

// Total: base_pay + six_day_bonus
```

### Bonus Calculation (When Rankings Entered in Week N+1)

```typescript
const days_worked = work_days.count(where: week_id = N)

let daily_bonus = 0
if (individual_level IN ['Fantastic', 'Fantastic+'] AND
    company_level IN ['Fantastic', 'Fantastic+']) {

  if (individual_level === 'Fantastic+' AND company_level === 'Fantastic+') {
    daily_bonus = 12
  } else {
    daily_bonus = 8
  }
}

bonus_amount = daily_bonus * days_worked
bonus_paid_in_week = N + 6
```

### Sweep Calculation

```typescript
weekly_sweep_total = SUM(work_days.stops_given - work_days.stops_taken) * 1 // £1 per stop

// Example:
// Mon: +12, -3 = +9
// Tue: +8, -0 = +8
// ...
// Weekly total: +38 stops = +£38
```

### Van Pro-Rata

```typescript
days_in_week = 7
daily_van_rate = van_weekly_rate / days_in_week
days_on_hire = count_days_between(on_hire_date, off_hire_date)
pro_rata_cost = daily_van_rate × days_on_hire
```

### Deposit Tracker

```typescript
if (weeks_with_van < 2) {
  weekly_deposit = £25
} else if (total_deposit < £500) {
  weekly_deposit = £50
} else {
  weekly_deposit = £0
}
```

### Weekly Pay Calculation

**Standard Pay for Week N (received in Week N+2)**:

```typescript
// Base pay from daily rates
base_pay = work_days.reduce((sum, day) => {
	const rate = day.route_type === 'Normal' ? normalRate : drsRate
	return sum + rate
}, 0)

// 6-day bonus (flat £30) - paid with standard pay
six_day_bonus = work_days.length === 6 ? 30 : 0

// Sweep adjustments - paid with standard pay
sweep_adjustment = work_days.reduce((sum, day) => {
	return sum + (day.stops_given - day.stops_taken)
}, 0)

// Mileage payment - paid with standard pay
mileage_payment = work_days.reduce((sum, day) => {
	const miles = day.amazon_paid_miles || 0
	const rate = day.mileage_rate || 1988 // pence per 100 miles (1988 = £0.1988/mile)
	return sum + miles * (rate / 10000) // Convert to pounds: 1988/10000 = £0.1988
}, 0)

// Van costs (pro-rata + deposit) - deducted from standard pay
van_deduction = pro_rata_van_cost + deposit_payment

// Invoicing service costs - deducted from standard pay
invoicing_cost =
	user_settings.invoicing_service === 'Verso-Basic' ? 1000 : // £10 in pence
	user_settings.invoicing_service === 'Verso-Full' ? 4000 :  // £40 in pence
	0 // Self-Invoicing

// Standard pay for Week N (received in Week N+2)
standard_pay =
	base_pay + six_day_bonus + sweep_adjustment + mileage_payment - van_deduction - invoicing_cost
```

**Performance Bonus Calculation (Week N bonus received in Week N+6)**:

```typescript
// Performance bonus from 6 weeks ago (earned Week N-6)
// This bonus is combined with current week's standard pay
performance_bonus_from_week_n_minus_6 = weeks[N - 6]?.bonus_amount || 0

// Total pay received in Week N+2:
// = Week N standard pay + Week N-6 performance bonus
total_pay_received =
	standard_pay + // Week N work
	performance_bonus_from_week_n_minus_6 // Week N-6 bonus (6-week delay)

// Example for Week 38 payment:
// - Week 36 standard pay (base + 6-day + sweeps + mileage - van) [2-week arrears]
// - Week 32 performance bonus (£48) [6-week delay]
// - Total received in Week 38
```

### Mileage Calculation

```typescript
// Daily mileage payment
amazon_miles = work_day.amazon_paid_miles || 0
mileage_rate = work_day.mileage_rate || 1988  // Default: 1988 = £0.1988/mile (19.88p/mile)
daily_mileage_payment = amazon_miles × (mileage_rate / 10000)  // Divide by 10000 to convert to £

// Mileage discrepancy tracking (for user awareness)
van_miles = work_day.van_logged_miles || 0
mileage_discrepancy = van_miles - amazon_miles
money_lost_on_fuel = mileage_discrepancy × (mileage_rate / 10000)

// Example:
// Amazon paid: 85 miles × £0.1988 = £16.90 (added to pay)
// Van logged: 98 miles
// Discrepancy: 13 miles × £0.1988 = £2.58 (additional money lost on fuel for unpaid miles)
```

### Off-boarding Final Pay Adjustment

```typescript
deposit_shortfall = 500 - van_hire.deposit_paid
final_pay = calculated_weekly_pay - deposit_shortfall

// £500 held for 6 weeks from off_hire_date
// Then refunded (minus any fines/damage)
```

## Edge Cases to Handle

1. **Partial weeks**: User starts/ends employment mid-week
2. **Van hire across weeks**: On-hire Sunday, off-hire next Tuesday
3. **Multiple van hires**: Switching vans (deposit carries over - one cumulative £500 total)
4. **Bonus entry timing**: Rankings available Week N+1, user enters late in Week N+3
5. **Historical lookback**: Viewing old weeks, editing past data
6. **Week 1-6 bonus display**: No bonus yet (6-week delay), show £0
7. **7-day work prevention**: UI validation to block 7 consecutive days
8. **Year boundaries**: Week 52/53 wrapping to Week 1, ISO week calculations
9. **Deposit refund tracking**: 6-week hold period expires, mark as refunded
10. **Sweep negatives**: Taking more stops than giving (net negative pay adjustment)

## User Workflows

### Week N: Logging Work

1. User logs work days (Monday-Saturday = 6 days)
2. User logs daily data:
   - Sweeps: +15 stops given, -3 stops taken
   - Mileage: Amazon paid 85 miles, Van logged 98 miles
   - App shows mileage pay (+£16.90) and fuel loss warning (-£2.58)
3. Van cost automatically calculated (pro-rata + deposit)
4. Bonus shows "£0 - Rankings not available yet"

### Week N+1: Entering Rankings

1. Rankings released (usually Thursday, can be 1-2 days late)
2. App notification: "Enter Week N rankings!"
3. User inputs:
   - Individual: Fantastic+
   - Company: Fantastic
4. System calculates bonus: 6 days × £8 = £48
5. Bonus tracked for payment in Week N+6 (6-week delay)

### Week N+2: Receiving First Payment

1. Pay breakdown shows (received in Week N+2):
   - Base pay: £960 (6 days × £160)
   - 6-day bonus: +£30
   - Sweeps: +£38
   - Mileage: +£101.40 (6 days average, ~85 miles/day)
   - Van: -£300
   - Net standard pay: £829.40

### Week N+6: Receiving Performance Bonus

1. Pay breakdown shows (received in Week N+6):
   - Week N+4 standard pay: £829.40 (base + 6-day + sweeps + mileage - van)
   - **Performance bonus from Week N: +£48** (6-week delay)
   - Total received: £877.40

## Validation Rules

### Data Entry Constraints

- Max days per week: 6 (hard block on 7)
- Max sweeps per day: 200 total (stops_given + stops_taken combined, sanity check)
- Mileage values: Must be non-negative decimals
- Mileage discrepancy warning: Show alert if van_logged_miles > amazon_paid_miles + 10%
- Date validation: Cannot log future dates
- Week validation: Cannot log before user.start_week

### Calculation Safeguards

- Bonus only calculated if both levels are Fantastic or above
- Van deposit cannot exceed £500 total (but carries over between van hires)
- Daily rate must match user's customized Normal or DRS rate (defaults: £160, £100)
- 6-day bonus is always £30 flat (6 × £5), applied as separate line item
- Pro-rata days cannot exceed 7 per week
- Display breakdown on pay page: base pay + 6-day bonus + sweeps + mileage - van costs + delayed bonus
- Mileage rate stored per day (default £0.45) to handle rate changes over time

## Future Feature Ideas

- **Team leaderboards**: Compare sweep totals, bonus achievements
- **Notifications**: Remind to log sweeps, update bonus levels
- **Predictions**: Forecast future earnings based on patterns
- **Tax calculations**: Estimated tax on earnings
- **Multi-DSP support**: Different companies, different rules
- **Mobile app**: Native iOS/Android
- **Export data**: CSV download of all pay history
- **Bonus reminder**: Auto-prompt on Monday of Week N+1

## Development Notes

### Authentication Flow

- Users sign up with email/password
- Email verification (optional for MVP)
- Each user sees only their own data (RLS)
- No admin panel needed for MVP

### Database Strategy

- Normalized structure to avoid redundancy
- Indexes on frequently queried fields (user_id, week_number, date)
- Store rates in user_settings for flexibility
- Store calculated values for performance (can recalculate if needed)
- RLS policies ensure users only access their own data

### Performance Considerations

- Calendar should load quickly (only fetch current month's data)
- Lazy load historical data
- Cache bonus calculations
- Optimize Supabase queries with proper indexes on:
  - `weeks(user_id, week_number, year)`
  - `work_days(week_id, date)`
  - `van_hires(user_id, off_hire_date)`

### Testing Strategy

- Manual testing with real scenarios
- Test ISO week calculations around year boundaries
- Test 6-week bonus delay with mock data
- Test van deposit calculations across multiple weeks
- Beta test with 2-3 team members
- Collect feedback before wider rollout

## Resolved Design Decisions (Oct 10, 2025)

1. **Bonus entry timing**: ✅ Remind users on Thursdays (when rankings released), allow retroactive entry with auto-recalculation

2. **Multiple van hires**: ✅ Sequential only (off-hire current, on-hire new), deposits carry over between vans

3. **7-day validation**: ✅ Hard block (illegal to work 7 consecutive days)

4. **Sweep detail tracking**: Track net totals only (stops given/taken per day)

5. **Deposit refund process**: User manually marks as refunded (future: could automate after 6 weeks)

6. **User settings**: ✅ Rates are editable in settings (£160, £100, £250 defaults) - 6-day bonus calculated (£30 flat)

7. **App navigation**: ✅ Dashboard-first (not calendar), with links to weekly/monthly/yearly views

8. **6-day bonus calculation**: ✅ Flat £30 bonus (6 × £5) added as separate line item, NOT baked into daily rate

9. **Van rates**: ✅ Customizable per van hire (not global setting) - Fleet vans £250, Flexi vans £100-£250

10. **Pay timing**: ✅ Standard pay 2 weeks in arrears (Week N+2), Bonus pay 6 weeks delayed (Week N+6)

---

## Development Progress (Oct 10, 2025)

### ✅ Phase 1: Setup & Foundation - COMPLETE

**All tasks completed!**

**Completed:**

- ✅ Vite + React 19 + TypeScript project initialized
- ✅ All dependencies installed (React Router 7, Zustand 5, date-fns 4, Supabase, etc.)
- ✅ Tailwind CSS v4 configured with custom design system (dark mode, glassmorphic cards)
- ✅ Folder structure created (components, features, lib, hooks, store, types, pages)
- ✅ shadcn/ui configured with 15 components installed (Button, Card, Input, Form, Calendar, Badge, Dialog, Tabs, Select, Dropdown Menu, Table, Popover, Sonner, Label)
- ✅ `src/lib/utils.ts` created (cn utility for className merging)
- ✅ Path aliases configured (@/\* imports working in TypeScript and Vite)
- ✅ Supabase project created
- ✅ Supabase client configured (`src/lib/supabase.ts` with type safety)
- ✅ Environment variables set up (.env.local with credentials, .env.example template)
- ✅ Build verified passing

### ✅ Phase 2: Database Design - COMPLETE

**All tasks completed!** Database is live with full type safety.

**Completed:**

- ✅ Database schema finalized (5 tables: users, user_settings, weeks, work_days, van_hires)
- ✅ SQL migration created: `supabase/migrations/20251010_initial_schema.sql`
- ✅ All tables created in Supabase via SQL Editor
- ✅ Row Level Security (RLS) policies implemented on all tables
- ✅ Performance indexes created (user_id, week_number, date, active van hires)
- ✅ Auto-updating `updated_at` triggers on all tables
- ✅ TypeScript types generated: `src/types/database.ts` (full type safety)
- ✅ Database constraints added (check constraints, unique constraints, foreign keys)
- ✅ Build verified passing with new types

**Key Files Created/Updated:**

- `supabase/migrations/20251010_initial_schema.sql` - Complete database schema
- `src/types/database.ts` - Auto-generated TypeScript types from schema
- All helper types: `User`, `UserSettings`, `Week`, `WorkDay`, `VanHire`
- Enum types: `PerformanceLevel`, `RouteType`, `VanType`

**Database Features:**

- All currency stored in pence (integers) for precision
- RLS policies enforce user data isolation
- Automatic timestamp updates via triggers
- Data validation via CHECK constraints
- Foreign key relationships with CASCADE deletes

**Package Manager:** pnpm (not npm/yarn)

**Build Command:** `pnpm run build` (runs TypeScript check + Vite build)

**Dev Command:** `pnpm dev` (starts Vite dev server)

### Phase 3: Core Configuration & Utils

- ✅ Calculation utilities implemented (`src/lib/calculations.ts` - 670 lines)

  - Daily calculations (pay, sweeps, mileage, discrepancies)
  - Weekly calculations (base pay, 6-day bonus, sweeps, mileage totals)
  - Performance bonus calculations with tier matrix
  - Van pro-rata and deposit calculations
  - Complete weekly pay breakdown function
  - Pay timing calculations (standard pay N+2, bonus N+6)
  - Comprehensive validation functions
  - All currency in pence for precision

- ✅ Extended TypeScript types (`src/types/index.ts` - 350 lines)

  - Computed data types (WorkDayWithPay, WeekWithPay, MileageSummary, etc.)
  - UI state types (calendar, forms, validation)
  - Statistics and analytics types
  - Prediction and notification types
  - Complete type safety for all features

- ✅ Performance bonus timing corrected throughout codebase
  - Fixed from Week N+8 to Week N+6
  - All documentation updated (CONTEXT.md, README.md, CLAUDE.md, SQL comments)
  - Code calculations corrected
  - Build verified passing

**Still Pending:**

- ⏳ Zustand store structure (not yet created)
- ⏳ Date helper functions (requires week numbering confirmation from manager)

### ✅ Phase 4: Authentication - COMPLETE (Oct 11, 2025)

**All tasks completed:**

- ✅ Auth context/provider created (`src/hooks/useAuth.tsx`)
- ✅ Login/signup pages built (`src/pages/Auth.tsx`)
- ✅ Supabase authentication implemented (`src/lib/auth.ts`)
- ✅ Protected routes set up (`src/App.tsx`)
- ✅ Auth state persistence handled
- ✅ Database trigger for automatic user profile creation
- ✅ RLS policies working correctly

### 🚀 Phase 5+: Core Features - READY TO START

**Option A: Dashboard & Calendar View (Recommended)**

1. Build weekly calendar (Sunday-Saturday)
2. Week number display and navigation
3. Day cells with visual indicators
4. Mobile-responsive design
5. Use calculation functions from `src/lib/calculations.ts`

**Option B: State Management Setup**

1. Set up Zustand store structure
2. User settings store
3. Calendar navigation state
4. Week data cache

**Option C: Date Helper Functions**

1. Custom week number calculation (Sunday-Saturday, 52-week year)
2. Week date range calculations
3. ⚠️ **Requires manager confirmation on week numbering system first**

**Option D: Test Database Connection**

1. Write test to insert/query data
2. Verify Supabase client connection
3. Test RLS policies are working
4. Test calculation functions with real data

**Pending Confirmation:**

- Week numbering system (TBC with manager - see Week Structure section above)

## Glossary

- **DSP**: Delivery Service Partner (company that contracts with Amazon)
- **DRS/Missort Route**: Cleanup parcels that didn't make it into correct bags in time (not area-specific, smaller routes)
- **Sweep/Sweeping**: Taking delivery stops from another driver who's behind
- **Stops Given**: Stops you took from others (positive to your pay)
- **Stops Taken**: Stops others took from you (negative to your pay)
- **Fantastic/Fantastic+**: Top two performance tiers (eligible for bonuses)
- **Rankings**: Performance levels released Week N+1 (Thursday) for Week N work
- **On-hire**: Taking possession of a rental van
- **Off-hire**: Returning a rental van
- **Pro-rata**: Proportional payment based on actual days used
- **Week Number**: Calendar week (Sunday-Saturday), NOT ISO 8601 week
- **Fleet Van**: Standard rental van (£250/week default)
- **Flexi Van**: Company-owned van, not fleet (£100-£250/week)
- **2-Week Arrears**: Standard pay (base + sweeps + van) paid 2 weeks after work
- **6-Week Delay**: Time between earning bonus and receiving bonus payment
- **Deposit Hold**: 6-week period after off-hire before refund issued

## Contact & Collaboration

- **Primary User**: Courier at Amazon DSP
- **Potential Users**: Team members at same DSP
- **Goal**: Personal tool first, potential to share with team

## Repository

- **GitHub**: https://github.com/benalk/wager
- **Status**: In active development (Phase 1)
- **License**: MIT

---

**Last Updated**: October 10, 2025 (v2 - Clarified Rules)
**Current Phase**: Phase 1 - Setup & Foundation
**Next Steps**: Database schema implementation + authentication setup
