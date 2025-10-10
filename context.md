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

- **Normal Route**: £160/day standard
- **6-Day Week Bonus**: +£5/day when you work ANY 6 days in a single week (total £165/day)
- **DRS Route**: £100/day (smaller routes, often assigned as punishment for infractions)
- **Hard Constraint**: Cannot work 7 days in a single week

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

- **Rankings revealed**: Week after work is completed (Week N work → Week N+1 rankings released)
- **Bonus paid**: 6 weeks after work is completed
- **Example Timeline**:
  - Week 39: Work 6 days (Monday-Saturday)
  - Week 40: Rankings released → Input: Individual Fantastic+, Company Fantastic
  - System calculates: 6 days × £8/day = £48 bonus
  - Week 45: Receive £48 bonus in your pay

**Bonus Calculation**: Per day worked (calculated when rankings entered)

- If you worked 6 days in Week 39 and earned Fantastic+/Fantastic → 6 × £8 = £48 bonus paid in Week 45

### Sweeping

- Sweeping = taking stops from drivers who are behind schedule
- **+£1 per stop** you take from someone else
- **-£1 per stop** someone takes from you
- **Tracked daily**, calculated weekly, paid in that week's pay
- Example:
  - Monday: +12 stops given, -3 stops taken
  - Tuesday: +8 stops given, -0 stops taken
  - Weekly total: +45 given, -7 taken = net +38 stops = **+£38**

### Van Hire

**Standard Rate**: £250/week (but customizable for different/older vans)

**Deposit Structure (During Employment)**:

- First 2 weeks: £25/week toward deposit
- After 2 weeks: £50/week toward deposit
- Total deposit required: £500
- Once £500 paid, only weekly rate applies

**Off-boarding Process**:

1. Courier gives notice / last day worked
2. Van returned on off-hire date
3. Company calculates deposit shortfall: `£500 - deposit_paid_so_far`
4. Final paycheck is reduced by shortfall amount
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

### Week Structure

- Weeks run **Sunday to Saturday**
- Week numbers follow ISO standard (e.g., Week 42 = Oct 12-18, 2025)
- Financial week = same as calendar week for this business

### Historical Data Policy

- **No backfill**: Users start tracking from their signup week
- **Fresh start**: If user signs up in Week 50, only track Week 50 onwards
- **Bonus gap**: First 6 weeks will show £0 bonus (nothing earned 6 weeks prior)
- **Example**: Sign up Week 50 → First potential bonus payment in Week 56 (from Week 50 work)

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
  daily_rate: number        // calculated: £160, £165, or £100
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
  normal_rate: number       // default £160
  six_day_rate: number      // default £165
  drs_rate: number          // default £100
  van_weekly_rate: number   // default £250
}
```

## Critical Calculations

### 6-Day Week Detection

```typescript
if (days_worked_in_week === 6) {
  daily_rate = £165  // £160 base + £5 bonus
} else {
  daily_rate = £160  // or £100 for DRS
}
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

```typescript
// For Week N:
base_pay = SUM(work_days.daily_rate) // £160/£165/£100 per day

six_day_bonus = days_worked === 6 ? days_worked * 5 : 0

sweep_adjustment = SUM(stops_given - stops_taken) * 1

van_deduction = pro_rata_van_cost + deposit_payment

bonus_from_week_n_minus_6 = weeks[N - 6].bonus_amount || 0

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
- Max sweeps per day: 200 (sanity check)
- Route type validation: DRS cannot have £165 rate
- Date validation: Cannot log future dates
- Week validation: Cannot log before user.start_week

### Calculation Safeguards

- Bonus only calculated if both levels are Fantastic or above
- Van deposit cannot exceed £500
- Daily rate must be £100, £160, or £165 only
- Pro-rata days cannot exceed 7 per week

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

## Open Questions (Needs Clarification)

1. **Bonus entry timing**: Should app remind/force users to enter rankings at start of Week N+1? Or allow retroactive entry anytime?

2. **Multiple van hires**: Can a courier have overlapping van hires? (e.g., crash van Week 52, new van Week 53, separate deposits?)

3. **7-day validation**: Hard block or soft warning with override option?

4. **Sweep detail tracking**: Track who you swept for? Or just net totals?

5. **Deposit refund process**: Does user manually mark as refunded? Or automatic after 6 weeks?

## Glossary

- **DSP**: Delivery Service Partner (company that contracts with Amazon)
- **DRS**: Smaller delivery routes (often used punitively)
- **Sweep/Sweeping**: Taking delivery stops from another driver who's behind
- **Stops Given**: Stops you took from others (positive to your pay)
- **Stops Taken**: Stops others took from you (negative to your pay)
- **Fantastic/Fantastic+**: Top two performance tiers (eligible for bonuses)
- **Rankings**: Performance levels released Week N+1 for Week N work
- **On-hire**: Taking possession of a rental van
- **Off-hire**: Returning a rental van
- **Pro-rata**: Proportional payment based on actual days used
- **Week Number**: ISO week number (Week 1 = first week with Thursday in new year)
- **6-Week Delay**: Time between earning bonus and receiving payment
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
