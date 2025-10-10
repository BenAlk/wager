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
  - Example: 6 days of Normal routes = (6 × £160) + £30 = £990 total base pay
- **Hard Constraint**: Cannot work 7 days in a single week (ILLEGAL - hard block in UI)

### Pay Timing

- **Standard Pay** (base + sweeps + van costs): Paid **2 weeks in arrears** (Week N work paid in Week N+2)
- **Bonus Pay**: Paid **6 weeks after work** (Week N work, bonus paid in Week N+6)
- Example:
  - Week 40: Work 6 days, earn £48 bonus eligibility
  - Week 42: Receive base pay for Week 40 (£990 + sweeps - van costs)
  - Week 46: Receive £48 bonus from Week 40

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

- **Rankings revealed**: Thursday of Week N+1 (week after work is completed)
- **Bonus paid**: 6 weeks after work is completed (Week N+6)
- **Reminder system**: App should notify users on Thursdays to enter rankings
- **Retroactive entry**: Allow users to enter rankings late, system auto-recalculates
- **Example Timeline**:
  - Week 39: Work 6 days (Monday-Saturday)
  - Week 40 (Thursday): Rankings released → Input: Individual Fantastic+, Company Fantastic
  - System calculates: 6 days × £8/day = £48 bonus
  - Week 41: Receive base pay for Week 39 (2-week arrears)
  - Week 45: Receive £48 bonus from Week 39 (6-week delay)

**Bonus Calculation**: Per day worked (calculated when rankings entered)

- If you worked 6 days in Week 39 and earned Fantastic+/Fantastic → 6 × £8 = £48 bonus paid in Week 45

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
- **Deposits carry over** between van hires (if you paid £300 on Van A, you need £200 more on Van B)

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

### Week Structure **(TBC - Pending Manager Confirmation)**

- Weeks run **Sunday to Saturday** (NOT Monday-Sunday)
- Week numbers follow a **52-week year starting in late December** (NOT ISO 8601, NOT calendar weeks)
- **2024-2025 Example**:
  - Week 1 = Sunday, December 29, 2024 - Saturday, January 4, 2025
  - Week 41 = Sunday, October 5, 2025 - Saturday, October 11, 2025
  - Week 52 = Sunday, December 21, 2025 - Saturday, December 27, 2025
- **2025-2026 Example**:
  - Week 1 = Sunday, December 28, 2025 - Saturday, January 3, 2026
- **Week 53 Rule**: Added when January 1st falls on a Sunday
  - Week 52 ends Saturday, December 24th
  - Week 53 = Sunday, December 25th - Saturday, December 31st (full 7 days)
  - Week 1 of new year = Sunday, January 1st - Saturday, January 7th
- **Implementation note**: Cannot use `date-fns` `getISOWeek()` - needs custom week calculation based on 52-week year cycle

### Historical Data Policy

- **No historical weeks**: Users signing up in Week 50 do NOT see Weeks 1-49 in UI (weeks before signup don't exist)
- **Bonus eligibility delay**:
  - User can enter rankings for early weeks (Week 50-55)
  - But £0 bonus shown until Week 56 (6 weeks after Week 50)
  - First bonus payment: Week 56 for Week 50 work
- **Pay timeline for new user (signs up Week 50)**:
  - Week 50: Work logged
  - Week 51 (Thursday): Enter Week 50 rankings
  - Week 52: Receive base pay for Week 50 (2-week arrears)
  - Week 56: Receive bonus for Week 50 (6-week delay)
- **Future Feature**: Historical data import (toggled in settings) - not MVP

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

### Core Tables

```typescript
users {
  id: uuid (PK)
  email: string
  start_week: number        // Week they joined app
  start_year: number
  created_at: timestamp
}

weeks {
  id: uuid (PK)
  user_id: uuid (FK)
  week_number: number       // ISO week
  year: number
  individual_level: enum    // null until Week N+1
    ('Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+')
  company_level: enum       // null until Week N+1
    ('Poor' | 'Fair' | 'Great' | 'Fantastic' | 'Fantastic+')
  bonus_amount: number      // calculated when levels entered
  bonus_paid_in_week: number // week_number + 6
  rankings_entered_at: timestamp
}

work_days {
  id: uuid (PK)
  week_id: uuid (FK)
  date: date
  route_type: enum ('Normal' | 'DRS')
  stops_given: number       // default 0
  stops_taken: number       // default 0
  daily_rate: number        // stored rate (£160 or £100, from settings at time of entry)
}

van_hires {
  id: uuid (PK)
  user_id: uuid (FK)
  on_hire_date: date
  off_hire_date: date       // null = still active
  weekly_rate: number       // default £250, customizable
  deposit_paid: number      // running total
  deposit_complete: boolean
  deposit_hold_until: date  // off_hire_date + 6 weeks
  deposit_refunded: boolean
  deposit_refund_amount: number
}

user_settings {
  user_id: uuid (PK, FK)
  normal_rate: number       // default £160 (customizable)
  drs_rate: number          // default £100 (customizable)
  // Note: 6-day bonus is calculated (£5 * 6 = £30), not a stored rate
}
```

## Critical Calculations

### 6-Day Week Bonus Calculation

```typescript
// Calculate base pay using standard rates
const base_pay = work_days.reduce((sum, day) => {
  const rate = day.route_type === 'Normal' ? normalRate : drsRate
  return sum + rate
}, 0)

// Add flat £30 bonus if worked exactly 6 days
const six_day_bonus = work_days.length === 6 ? 30 : 0  // 6 * £5

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

**For Week N (paid in Week N+2)**:

```typescript
// Base pay from daily rates
base_pay = work_days.reduce((sum, day) => {
  const rate = day.route_type === 'Normal' ? normalRate : drsRate
  return sum + rate
}, 0)

// 6-day bonus (flat £30)
six_day_bonus = work_days.length === 6 ? 30 : 0

// Sweep adjustments
sweep_adjustment = work_days.reduce((sum, day) => {
  return sum + (day.stops_given - day.stops_taken)
}, 0)

// Van costs (pro-rata + deposit)
van_deduction = pro_rata_van_cost + deposit_payment

// Delayed bonus from 6 weeks ago
bonus_from_week_n_minus_6 = weeks[N - 6]?.bonus_amount || 0

// Total pay for Week N (received in Week N+2)
weekly_net_pay =
  base_pay +
  six_day_bonus +
  sweep_adjustment -
  van_deduction +
  bonus_from_week_n_minus_6
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
3. **Multiple van hires**: Switching vans (new deposit tracking per hire)
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
2. User logs daily sweeps:
   - Monday: +15 stops given, -3 stops taken
   - Tuesday: +8 stops given, -0 stops taken
   - etc.
3. Van cost automatically calculated (pro-rata + deposit)
4. Bonus shows "£0 - Rankings not available yet"

### Week N+1: Entering Rankings

1. Rankings released (Monday of Week N+1)
2. App notification: "Enter Week N rankings!"
3. User inputs:
   - Individual: Fantastic+
   - Company: Fantastic
4. System calculates bonus: 6 days × £8 = £48
5. Bonus tracked for payment in Week N+6

### Week N+6: Receiving Bonus

1. Pay breakdown shows:
   - Base pay: £990 (6 days × £165)
   - Sweeps: +£38
   - Van: -£300
   - **Bonus from Week N: +£48**
   - Net: £776

## Validation Rules

### Data Entry Constraints

- Max days per week: 6 (hard block on 7)
- Max sweeps per day: 200 total (stops_given + stops_taken combined, sanity check)
- Date validation: Cannot log future dates
- Week validation: Cannot log before user.start_week

### Calculation Safeguards

- Bonus only calculated if both levels are Fantastic or above
- Van deposit cannot exceed £500 total (but carries over between van hires)
- Daily rate must match user's customized Normal or DRS rate (defaults: £160, £100)
- 6-day bonus is always £30 flat (6 × £5), applied as separate line item
- Pro-rata days cannot exceed 7 per week
- Display breakdown on pay page: base pay + 6-day bonus + sweeps - van costs + delayed bonus

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

**All tasks completed!** Project is ready for database design and feature development.

**Completed:**
- ✅ Vite + React 19 + TypeScript project initialized
- ✅ All dependencies installed (React Router 7, Zustand 5, date-fns 4, Supabase, etc.)
- ✅ Tailwind CSS v4 configured with custom design system (dark mode, glassmorphic cards)
- ✅ Folder structure created (components, features, lib, hooks, store, types, pages)
- ✅ shadcn/ui configured with 15 components installed (Button, Card, Input, Form, Calendar, Badge, Dialog, Tabs, Select, Dropdown Menu, Table, Popover, Sonner, Label)
- ✅ `src/lib/utils.ts` created (cn utility for className merging)
- ✅ Path aliases configured (@/* imports working in TypeScript and Vite)
- ✅ Supabase project created
- ✅ Supabase client configured (`src/lib/supabase.ts` with type safety)
- ✅ Environment variables set up (.env.local, .env.example) - **User needs to fill in actual credentials**
- ✅ Base TypeScript types created (`src/types/database.ts` placeholder with enums)
- ✅ Build verified passing

**Key Files Created:**
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/utils.ts` - Utility functions (cn helper)
- `src/types/database.ts` - Database type definitions (placeholder)
- `src/components/ui/` - 15 shadcn/ui components
- `.env.local` - Environment variables (needs Supabase credentials)
- `.env.example` - Environment template for other developers
- `tailwind.config.js` - Tailwind v4 configuration
- `postcss.config.js` - PostCSS with Tailwind v4 plugin
- `components.json` - shadcn/ui configuration
- `tsconfig.app.json` - TypeScript with path aliases
- `vite.config.ts` - Vite with path resolution

**Package Manager:** pnpm (not npm/yarn)

**Build Command:** `pnpm run build` (runs TypeScript check + Vite build)

**Dev Command:** `pnpm dev` (starts Vite dev server)

### ⏳ Phase 2: Database Design - NEXT

**Ready to start:**
1. Finalize database schema (tables, columns, relationships)
2. Create database tables in Supabase SQL Editor
3. Set up Row Level Security (RLS) policies for all tables
4. Create indexes for performance optimization
5. Auto-generate TypeScript types from schema
6. Test database connections

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
