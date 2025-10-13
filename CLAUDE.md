# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wager** is a pay tracking and schedule management application built for Amazon DSP (Delivery Service Partner) couriers. It handles complex calculations including:

- Variable daily rates with 6-day week bonuses
- 6-week delayed bonus system with performance tiers
- Sweep adjustments (stops given/taken from other drivers)
- Van rental costs with pro-rata and deposit tracking
- Multi-week financial projections

The app is designed for couriers who need to accurately predict weekly earnings despite complex, interconnected variables.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server (Vite)
- `pnpm build` - Build for production (runs TypeScript check + Vite build)
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build

### Package Manager

This project uses **pnpm** exclusively. Do not use npm or yarn.

## Tech Stack

- **React 18+** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling (dark mode first)
- **shadcn/ui** - UI component library (to be set up)
- **Zustand** - State management (to be implemented)
- **Supabase** - Backend (PostgreSQL + auth, to be configured)
- **date-fns** - Date manipulation (to be added)
- **React Hook Form + Zod** - Forms & validation (to be added)
- **Lucide React** - Icons (to be added)

## Architecture

### Core Business Logic

The app revolves around **week-based pay calculations** where multiple factors combine:

1. **Base Pay**: £160/day (Normal) or £100/day (DRS, customizable in settings), with flat £30 bonus when working exactly 6 days
2. **Pay Timing**: Standard pay (base + sweeps + van) paid 2 weeks in arrears (Week N+2); Bonuses paid 6 weeks after work (Week N+6)
3. **Sweeps**: ±£1 per stop given/taken, calculated weekly, paid with standard pay (Week N+2)
4. **Van Costs**: Weekly rate (default £250, customizable per van hire) + deposit payments (£25/week for 2 weeks, then £50/week until £500 total)

### Critical Calculation Rules

**6-Day Week Bonus**:

- Must work exactly 6 days in a single week (Sunday-Saturday)
- Flat £30 bonus (6 × £5) added as separate line item to weekly pay
- Works with ANY route type combination (6 Normal, 6 DRS, or mixed routes)
- Paid with standard pay Week N+2 (part of base pay, NOT delayed like performance bonus)
- NOT baked into daily rate - calculated as: base_pay + six_day_bonus
- Working 7 days is ILLEGAL - must be blocked in UI

**Performance Bonus Delay System**:

- Work completed in Week N
- Rankings revealed usually Thursday of Week N+1 (can be delayed 1-2 days)
- Performance bonus from Week N combined with Week N+6 standard pay
- Total received in Week N+8 (6-week bonus delay + 2-week pay arrears)
- Formula: `days_worked × daily_bonus_rate` where daily_bonus is £12 (both Fantastic+) or £8 (mixed Fantastic/Fantastic+)
- Reminder system helps users enter rankings (not strict Thursday-only)

**Van Pro-Rata**:

- On-hire/off-hire dates determine actual days charged
- Formula: `(weekly_rate / 7) × days_with_van`
- Deposit carries over between sequential van hires (one cumulative £500 total, NOT per van)
- Example: £300 paid on Van A, switch to Van B → only owe £200 more

**Sweep Tracking**:

- Tracked per day with breakdown: store both `stops_given` and `stops_taken`
- Calculate net: `(stops_given - stops_taken) × £1`
- Max 200 sweeps per day (total: stops_given + stops_taken combined, sanity check)
- Paid with standard pay 2 weeks in arrears (Week N+2)

### Database Schema (Planned)

Key tables to implement:

- `users` - User accounts with start_week/start_year
- `weeks` - Weekly records with performance levels and bonus calculations
- `work_days` - Daily records (route_type, stops_given, stops_taken, calculated daily_rate)
- `van_hires` - Van rental periods with on/off-hire dates, deposits
- `user_settings` - Customizable rates (£160, £165, £100, £250 defaults)

**Important**: Use Row Level Security (RLS) to isolate user data. Each user only sees their own records.

### State Management Strategy

Use Zustand for:

- Current week navigation state
- User settings cache
- Calendar view state
- Form states (day details, bonus entry, sweep logs)

Keep complex calculations in `src/lib/calculations.ts` as pure functions that can be tested independently.

### Folder Structure Philosophy

- `src/components/` - Presentational components
  - `ui/` - shadcn/ui base components
  - `calendar/` - Calendar-specific components
  - `dashboard/` - Dashboard widgets
  - `settings/` - Settings forms
  - `shared/` - Reusable components
- `src/features/` - Business logic organized by domain
  - `auth/`, `schedule/`, `bonus/`, `sweeping/`, `van/`, `pay/`
- `src/lib/` - Shared utilities and service clients
  - `calculations.ts` - Pure pay calculation functions
  - `supabase.ts` - Supabase client configuration
  - `utils.ts` - General helpers (cn, date helpers, formatters)
- `src/store/` - Zustand stores
- `src/types/` - TypeScript type definitions
- `src/pages/` - Route-level components
- `supabase/migrations/` - Database migrations

## Design System

**Color Palette**:

- Primary gradient: `from-blue-500 to-emerald-500` (trust → earnings)
- Dark mode default: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- Glassmorphic cards: `bg-white/10 backdrop-blur-xl border border-white/20`
- Semantic colors: emerald (positive pay), red (deductions), amber (warnings)

**Typography**:

- Currency: Always use `font-mono font-bold` for scannability
- Format: `£1,234.56` (include £ symbol, use commas)

**Component Patterns**:

- Primary buttons: Gradient with shadow and scale transform on hover
- Cards: Glassmorphic with backdrop-blur
- Forms: `bg-white/5 border border-white/10` with blue focus rings

See DESIGN.md for complete design system specifications.

## Key Edge Cases

1. **Week boundaries**: ISO week numbers, especially Week 52/53 → Week 1 transitions
2. **Partial weeks**: Users starting/ending employment mid-week
3. **Van transitions**: Sequential van hires with deposit carryover
4. **Late bonus entry**: Users entering Week N rankings in Week N+3 (allow retroactive entry)
5. **First 6 weeks**: Show £0 bonus (no earnings 6 weeks prior yet)
6. **Sweep negatives**: Net negative sweep balance (more stops taken than given)
7. **Off-boarding**: Deposit shortfall deducted from final pay, £500 held for 6 weeks

## Domain-Specific Constraints

- **Hard constraint**: Cannot work 7 days in a week (illegal under UK working time regulations)
- **Week structure (TBC)**: Sunday to Saturday, 52-week year starting late December (NOT ISO 8601)
  - Week 1 (2024-25) = Dec 29, 2024 - Jan 4, 2025
  - Week 41 (2025) = Oct 5, 2025 - Oct 11, 2025
  - Week 52 (2025) = Dec 21, 2025 - Dec 27, 2025
  - Week 53: When Jan 1 = Sunday (Week 52 ends Dec 24, Week 53 = Dec 25-31, Week 1 = Jan 1-7)
  - Cannot use `date-fns` `getISOWeek()` - needs custom 52-week year calculation
- **Pay timing**: Standard pay (Week N+2), Bonus pay (Week N+6)
- **Rankings timing**: Released Thursday of Week N+1, should prompt users to enter
- **Route types**: "Normal" (£160) or "DRS/Missort" (£100) - cleanup routes, not area-specific
- **Van rates**: Fleet vans £250 (default), Flexi vans £100-£250 (customizable per hire)
- **Deposit cap**: £500 total, carries over between sequential van hires
- **Deposit hold**: 6 weeks after van off-hire before refund

## Code References

When implementing features, reference these key sections:

- Pay calculation logic: See CONTEXT.md lines 224-327
- Bonus tier matrix: CONTEXT.md lines 40-62
- Van deposit structure: CONTEXT.md lines 84-99
- Database schema: CONTEXT.md lines 166-221

## Context Files

- **README.md**: Project overview, tech stack, development roadmap
- **CONTEXT.md**: Complete business rules, calculation formulas, edge cases, workflows
- **DESIGN.md**: Full design system, component library, color palette, typography

Read these files before implementing features to understand business logic and design patterns.

## Testing Strategy

Focus testing on:

1. Pay calculation accuracy across all combinations
2. ISO week number calculations (especially year boundaries)
3. 6-week bonus delay logic with mock timeline data
4. Pro-rata van cost calculations
5. 6-day week detection and rate adjustments

Use real-world scenarios from CONTEXT.md examples to create test cases.

## Development Status

Currently in **Phase 1: Setup & Foundation**. The project has basic structure but core features are not yet implemented. Next steps:

1. Set up shadcn/ui and install initial components
2. Configure Supabase project and client
3. Implement database schema with RLS policies
4. Create TypeScript types for all data models
5. Build authentication flow

See README.md lines 127-257 for complete development roadmap.

## Important Notes

- **User isolation**: Every query must filter by `user_id` (enforce with RLS)
- **Week numbering**: Calendar weeks (Sunday-Saturday), NOT ISO 8601 - need custom calculation
  - **PENDING MANAGER CONFIRMATION**
- **No historical data by default**: Users joining Week 50 see only Week 50+ (no weeks before signup)
  - Start week automatically set to current week at signup
  - Future feature: Manual historical data backfill (TBC, not MVP)
- **Currency precision**: Always calculate in pence internally, display in pounds
- **Retroactive updates**: When rankings or sweep data changes, recalculate affected weeks
- **Mobile-first**: Many users will check on phones during/after shifts
- **Performance**: Optimize for fast calendar loading (only fetch current month initially)
- **Data integrity**: Store daily_rate from settings at time of entry, calculate 6-day bonus dynamically
