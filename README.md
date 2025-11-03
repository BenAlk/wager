# Wager 💰

A comprehensive pay tracking and schedule management application for Amazon DSP couriers.

## Overview

**Wager** is designed to help Amazon DSP couriers accurately track their weekly pay, including complex calculations for bonuses, sweep adjustments, van rentals, and deposits. The app provides a visual calendar interface to plan rotas and predict expected earnings with precision.

## Problem Statement

As a courier working for a DSP (Delivery Service Partner) that works with Amazon, tracking pay can be complex due to:

- Variable daily rates based on days worked per week
- 6-week delayed bonus system with multiple tier combinations
- Sweep adjustments (stops given/taken from other drivers)
- Mileage payments and discrepancies between paid and actual miles
- Van rental costs with pro-rata calculations
- Deposit payments with changing weekly rates
- Different pay structures for Normal vs DRS routes

**Wager** solves this by automating all calculations and providing clear visibility into current and upcoming pay.

## Key Features

### 📅 Weekly Calendar

- Visual calendar running Sunday to Saturday
- Week number display (e.g., "Week 42")
- Easy navigation between weeks
- Quick day type assignment (Normal/DRS)
- **Payment This Week** section showing actual bank deposits
- 6-day work limit validation (blocks 7th day - illegal)
- Back to dashboard navigation

### 💵 Pay Tracking

- **Normal Routes**: £160/day (customizable in settings)
- **DRS/Missort Routes**: £100/day (customizable in settings)
- **6-Day Bonus**: Flat £30 bonus (6 × £5) when working exactly 6 days (any route type combination)
- **Pay Timing**: Standard pay 2 weeks in arrears (Week N+2), performance bonuses received 6 weeks after work (Week N+6)
- **Payment This Week Display**:
  - Shows Week N-2 standard pay (what you're receiving this week)
  - Shows Week N-6 bonus payment (delayed performance bonus)
  - Complete breakdown of all payment components
  - Clear labeling of which past weeks payments are from
- Real-time pay calculations
- Week summary showing earnings for current week

### 🎯 Bonus System

- 5 performance levels: Poor, Fair, Great, Fantastic, Fantastic+
- Individual and company performance tracking
- Bonus tiers:
  - Both Fantastic+: £16/day
  - Mixed Fantastic/Fantastic+: £8/day
- 6-week delay calculation (Week 33 work, bonus received Week 39 with Week 37 standard pay)

### 🚚 Sweep Tracking

- Log stops given to other drivers (+£1 per stop)
- Log stops taken from you (-£1 per stop)
- Weekly sweep balance calculation
- Paid with standard pay (Week N+2)
- Running totals in dashboard

### 🛣️ Mileage Tracking

- **Amazon Paid Mileage**: Track stop-to-stop miles paid by Amazon
- **Van Logged Mileage**: Record actual odometer miles driven
- **Flexible Rate Management**:
  - Default rate: £0.1988/mile (19.88p/mile) - customizable in settings
  - Per-week rate editing via subtle pencil button in summary
  - Amazon periodically adjusts rates based on fuel prices
  - New weeks auto-populate with your default rate
- **Automatic calculations**: Mileage pay calculated using week's rate
- **Discrepancy alerts**: See where you're losing money on unpaid fuel costs
- **Weekly summaries**: Total paid miles vs actual miles driven
- **Historical tracking**: Monitor mileage trends over time
- Paid with standard pay (Week N+2)

### 🚐 Van Hire Management

- **Fleet vans**: £250/week (default)
- **Flexi vans**: £100-£250/week (customizable per van hire)
- On-hire/off-hire functionality with pro-rata calculations
- Deposit tracker:
  - First 2 weeks: £25/week
  - Remaining weeks: £50/week until £500 total
  - Deposits carry over between sequential van hires
- Visual deposit progress
- 6-week hold period after off-hire before refund

### 📋 Invoicing & Accounting Services

- **Self-Invoicing**: £0/week (default for self-employed)
  - Handle your own invoicing and tax returns
- **Verso Basic**: £10/week
  - Professional invoicing service
  - Public liability insurance included
  - Requires Ltd company setup
- **Verso Full**: £30/week
  - Complete invoicing service
  - Public liability insurance included
  - Full accounting and tax returns handled
  - Requires Ltd company setup
- Weekly costs automatically deducted from standard pay

### 📊 Dashboard & Reports

- Current week expected pay
- Upcoming pay (including delayed bonuses)
- Historical pay records
- Weekly/monthly statistics
- Export functionality

## Tech Stack

### Frontend

- **React 18+** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **date-fns** - Date manipulation
- **React Hook Form** + **Zod** - Form handling & validation
- **Lucide React** - Icon library

### Backend

- **Supabase** - PostgreSQL database, authentication, and real-time subscriptions

### Deployment

- **Netlify** - Frontend hosting (Free tier)
  - Automatic deployments from git
  - SPA routing configured via `_redirects` and `netlify.toml`
  - Custom domain support
- **Supabase** - Backend infrastructure (Cloud PostgreSQL + Auth)

## Project Structure

```
wager/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn UI components (Button, Input, NumberInput, etc.)
│   │   ├── calendar/        # Calendar view components
│   │   │   ├── DayCell.tsx           # Individual day display
│   │   │   ├── DayEditModal.tsx      # Work day CRUD modal
│   │   │   ├── PaymentThisWeek.tsx   # Week N-2 + N-6 payment display
│   │   │   └── WeekSummary.tsx       # Current week earnings breakdown
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── settings/        # Settings forms
│   │   └── shared/          # Reusable components
│   ├── features/
│   │   ├── auth/            # Authentication logic
│   │   ├── schedule/        # Week/day management
│   │   ├── bonus/           # Bonus calculations
│   │   ├── sweeping/        # Sweep tracking
│   │   ├── van/             # Van hire management
│   │   └── pay/             # Pay calculations
│   ├── lib/
│   │   ├── api/
│   │   │   └── weeks.ts          # Week/work day API functions
│   │   ├── supabase.ts           # Supabase client
│   │   ├── calculations.ts       # Pay calculation utilities
│   │   ├── dates.ts              # Week calculations & formatting
│   │   └── utils.ts              # General utilities
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── pages/               # Route pages
│   └── App.tsx
├── supabase/
│   └── migrations/          # Database migrations
├── public/
│   └── _redirects           # Netlify SPA routing config
├── netlify.toml             # Netlify build configuration
└── package.json
```

## Development Roadmap

### Phase 1: Setup & Foundation ✅ **COMPLETE**

**All tasks completed!**

- [x] Initialize Vite + React + TypeScript project
- [x] Install all dependencies (React Router, Zustand, date-fns, Supabase, etc.)
- [x] Set up Tailwind CSS v4 configuration with custom design system
- [x] Create folder structure (components, features, lib, hooks, store, types, pages)
- [x] Set up shadcn/ui and install 15 components (Button, Card, Input, Form, Calendar, etc.)
- [x] Create `src/lib/utils.ts` helper function (cn utility for className merging)
- [x] Configure path aliases (@/\* imports in tsconfig and vite.config)
- [x] Set up Supabase project (cloud database)
- [x] Configure Supabase client (`src/lib/supabase.ts` with type safety)
- [x] Set up environment variables (.env.local for secrets, .env.example for docs)
- [x] Create base TypeScript types (`src/types/database.ts` placeholder with enums)
- [x] Verify build passes with all configurations

### Phase 2: Database Design ✅ **COMPLETE**

**All tasks completed!** Database is live with full type safety.

- [x] Design complete database schema (5 tables)
- [x] Create database tables (users, user_settings, weeks, work_days, van_hires)
- [x] Set up Row Level Security (RLS) policies on all tables
- [x] Create performance indexes
- [x] Write migration file (`supabase/migrations/20251010_initial_schema.sql`)
- [x] Deploy migration to Supabase successfully
- [x] Generate TypeScript types from schema (`src/types/database.ts`)
- [x] Test database connection and verify build passes

### Phase 3: Core Configuration & Utils ✅ **COMPLETE**

- [x] Create TypeScript interfaces for all data models
- [x] Create calculation utilities (670 lines in src/lib/calculations.ts)
- [x] Create extended type system (350 lines in src/types/index.ts)
- [x] Correct performance bonus timing throughout codebase
- [x] Create date helper functions (400+ lines in src/lib/dates.ts with 40 passing tests)
- [x] Set up Zustand store structure (5 stores: auth, settings, calendar, weeks, van)

### Phase 4: Authentication ✅ **COMPLETE**

- [x] Create auth context/provider
- [x] Build login/signup pages
- [x] Implement Supabase authentication
- [x] Set up protected routes
- [x] Add logout functionality
- [x] Handle auth state persistence

### Phase 5: Settings Management ✅ **COMPLETE**

- [x] Create settings page layout
- [x] Build rate configuration forms (Normal/DRS rates)
- [x] Build invoicing service selection (Self-Invoicing, Verso Basic, Verso Full)
- [x] Implement save/load settings with Supabase
- [x] Add validation and error handling with Zod + React Hook Form
- [x] Custom styled increment/decrement buttons
- [x] Mobile-responsive design

### Phase 6: Calendar Core ✅ **COMPLETE**

- [x] Create weekly calendar component
- [x] Implement week number calculation
- [x] Build week navigation
- [x] Create day cell component
- [x] Add day type selection
- [x] Make responsive for mobile

### Phase 7: Day Management ✅ **COMPLETE**

- [x] Create day detail modal
- [x] Add notes functionality
- [x] Display calculated pay per day
- [x] Implement day data persistence
- [x] Color-coded sweep inputs (green for helping, red for being helped)
- [x] Integer-only mileage inputs
- [x] Custom NumberInput component with chevron arrows

### Phase 8: Bonus System ✅ **COMPLETE**

- [x] Create bonus input UI
- [x] Build performance dropdowns
- [x] Implement bonus calculation logic
- [x] Implement 6-week delay calculation
- [x] Display bonus indicators
- [x] Edit functionality for correcting rankings

### Phase 9: Sweeping System ✅ **COMPLETE**

- [x] Create sweep log UI
- [x] Add stops given/taken inputs
- [x] Calculate sweep balances
- [x] Display sweep totals
- [x] Clear language ("you helped" vs "helped you")

### Phase 10: Van Hire Management

- [ ] Create van management UI
- [ ] Implement on-hire/off-hire functionality
- [ ] Calculate pro-rata costs
- [ ] Build deposit tracker
- [ ] Display deposit progress

### Phase 11: Pay Calculations Engine

- [ ] Build core pay calculation function
- [ ] Implement all rate calculations
- [ ] Integrate bonus calculations
- [ ] Apply sweep adjustments
- [ ] Calculate van deductions
- [ ] Test all edge cases

### Phase 12: Dashboard & Reports

- [ ] Create main dashboard layout
- [ ] Build pay widgets
- [ ] Create historical records view
- [ ] Add statistics and visualizations
- [ ] Implement filtering options

### Phase 13: Additional Features

- [ ] Add export/backup functionality
- [ ] Implement comprehensive validation
- [ ] Add loading states
- [ ] Create notification system
- [ ] Add confirmation dialogs

### Phase 14: UI/UX Polish

- [ ] Make fully responsive
- [ ] Add animations and transitions
- [ ] Implement keyboard shortcuts
- [ ] Create onboarding flow
- [ ] Improve accessibility

### Phase 15: Testing & Deployment

- [ ] Test all calculations
- [ ] Test multi-user isolation
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [x] Deploy to Netlify (production)
- [ ] Beta testing with team

## Deployment

### Netlify Setup ✅ **LIVE**

The app is deployed on Netlify Free tier at: **wager.netlify.app**

#### Configuration Files

1. **`public/_redirects`** - Single-line file for SPA routing:
   ```
   /*    /index.html   200
   ```

2. **`netlify.toml`** - Full build configuration:
   ```toml
   [build]
     command = "pnpm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

#### Why Both Files?

- `_redirects` is simpler and widely recognized
- `netlify.toml` is more explicit and documents build settings
- Having both ensures maximum compatibility

#### SPA Routing Fix

These files solve the "Page Not Found" error when directly navigating to routes like `/dashboard` or `/calendar`. Without them, Netlify tries to find actual files at those paths instead of letting React Router handle the routing.

#### Deploy Process

1. Push code to GitHub
2. Netlify automatically detects changes
3. Runs `pnpm run build`
4. Deploys `dist/` folder
5. Applies redirect rules

#### Environment Variables (Netlify Dashboard)

Required environment variables in Netlify:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Contributing

This project is currently in active development. Contributions, issues, and feature requests are welcome!

## License

MIT

## Author

Ben Alkureishi

---

**Status**: 🚧 In Development
**Version**: 0.1.0 (MVP)
