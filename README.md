# Wager 💰

A comprehensive pay tracking and schedule management application for Amazon DSP couriers.

## Overview

**Wager** is designed to help Amazon DSP couriers accurately track their weekly pay, including complex calculations for bonuses, sweep adjustments, van rentals, and deposits. The app provides a visual calendar interface to plan rotas and predict expected earnings with precision.

### ♿ Accessibility

**Wager is built for everyone.** We've achieved **90-95% WCAG 2.1 AA compliance** to ensure the app is usable by couriers with disabilities:

- ✅ **Screen Reader Support** - All interactive elements have descriptive labels
- ✅ **Keyboard Navigation** - Complete app access without a mouse
- ✅ **Text Zoom** - Users can resize text up to 200% on mobile
- ✅ **Motion Safety** - Respects reduced motion preferences
- ✅ **Password Managers** - Full autocomplete support for secure credentials
- ✅ **Semantic Structure** - Proper heading hierarchy for easy navigation

See [ACCESSIBILITY_AUDIT.md](ACCESSIBILITY_AUDIT.md) for full compliance details.

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
- Easy navigation between weeks (previous/next/today buttons)
- URL-based navigation (shareable week links)
- Quick day type assignment (Normal/DRS)
- **Dual Mileage Display** on day cells:
  - Amazon paid miles 📍 (gray pin, white text)
  - Van logged miles 🚐 (yellow van, yellow text)
  - Difference indicator Δ with color coding:
    - Red if van miles > paid miles (losing money)
    - Green if van miles < paid miles (good deal)
    - Gray if exact match
- **Payment This Week** section showing actual bank deposits
  - Week N-2 standard pay breakdown
  - Week N-6 performance bonus (when entered)
  - Missing rankings reminder with one-click navigation
- **Week Summary** with full pay breakdown
  - Real-time calculations
  - Performance rankings input (available from Week N+2)
  - Edit rankings functionality
  - Weekly mileage rate adjustment
  - Clear week functionality
- 6-day work limit validation (blocks 7th day - illegal)
- Back to dashboard navigation
- Custom NumberInput components with styled increment/decrement arrows throughout

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

### 🚐 Van Hire Management ✅ **COMPLETE**

- **Separate van management page** accessible from dashboard
- **Complete CRUD operations**: Create, edit, off-hire, and delete van hires
- **Fleet vans**: £250/week (default)
- **Flexi vans**: £100-£250/week (customizable per van hire)
- **Pro-rata calculations**: (weekly_rate / 7) × days_active for partial weeks
- **Multiple vans per week**: Supports mid-week van changes with separate pro-rata costs
- **Intelligent deposit tracking**:
  - First 2 weeks with ANY van: £25/week
  - Weeks 3+ with ANY van: £50/week until £500 total
  - Deposits cumulative across ALL van hires (one £500 total)
  - Automatic chronological calculation
  - ONE deposit payment per week (not per van)
- **Manual deposit adjustment**: For users who paid deposits before using app
- **Week offset logic**: Manual deposits ≥£50 skip the £25/week period
- **Visual deposit progress**: Summary card with progress bar
- **Van hire history**: Filterable list with status badges (active/off-hired)
- **Off-hire date inclusive**: Last day WITH the van
- **Same-day swap guidance**: Informational message for morning van swaps
- **Custom delete confirmation**: No accidental deletions
- **Auto-dismiss toasts**: 3-second notifications
- **6-week hold period**: After off-hire before refund
- **Integrated with pay calculations**: Van costs show in week summaries with breakdown

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
- **Historical Accuracy**: Service level is snapshot per week - changing your service level in settings doesn't affect past weeks' calculations

### 📊 Dashboard & Reports ✅ **COMPLETE**

- **6 Interactive Tiles** with mobile-first responsive layout:
  - **Quick Add Work**: Create/edit today's work with route type & number, auto-rate calculation, contextual button text ("Add Work" vs "Confirm Edits")
  - **Quick Add Sweeps**: Update sweeps for today, shows entered data with edit button, color-coded display (red/green)
  - **Quick Add Odometer**: Log van miles for today, shows entered data with edit button, yellow van theme 🚐
  - **Payment Tile**: Clickable tile with detailed modal breakdown showing Week N-2 standard pay + Week N-6 bonus with all components
  - **Rankings Reminder**: Week N-2 rankings entry with projected bonus, smart placeholders (entered/no work/missing)
  - **Van Status Tile**: Shows active or last van with deposit progress, quick off-hire button, placeholder state when no van
- **Responsive Tile Ordering**: Different layouts for mobile vs desktop (CSS Grid with order utilities)
- **Consistent UX**: All buttons positioned at bottom, uniform sizing (w-full h-10), flexbox layout
- **Real-time Sync**: Dashboard updates automatically sync with calendar via weeks store cache
- **Edit Mode**: All quick add tiles support in-place editing with populated forms and contextual messaging

## Tech Stack

### Frontend

- **React 19** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS v4** - Utility-first styling with custom theme system
- **shadcn/ui** - Accessible UI components (Radix UI primitives)
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management (6 stores)
- **Framer Motion** - Smooth animations with reduced motion support
- **date-fns** - Date manipulation
- **React Hook Form** + **Zod** - Form handling & validation
- **Lucide React** - Icon library
- **@axe-core/react** - Development-only accessibility auditing

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
│   │   ├── ui/              # shadcn UI components (Button, Input, NumberInput, Select, etc.)
│   │   ├── calendar/        # Calendar view components
│   │   │   ├── DayCell.tsx           # Individual day display with dual mileage
│   │   │   ├── DayEditModal.tsx      # Work day CRUD modal
│   │   │   ├── PaymentThisWeek.tsx   # Week N-2 + N-6 payment display
│   │   │   └── WeekSummary.tsx       # Current week earnings breakdown
│   │   ├── van/             # Van management components
│   │   │   ├── VanHireCard.tsx       # Individual van display
│   │   │   └── VanHireModal.tsx      # Van hire CRUD modal
│   │   ├── dashboard/       # Dashboard tiles (6 interactive widgets)
│   │   │   ├── QuickAddWorkTile.tsx      # Create/edit today's work
│   │   │   ├── QuickAddSweepsTile.tsx    # Log sweeps with edit mode
│   │   │   ├── QuickAddOdometerTile.tsx  # Log van miles with edit mode
│   │   │   ├── RankingsReminderTile.tsx  # Week N-2 rankings entry
│   │   │   ├── PaymentTile.tsx           # Clickable tile with modal breakdown
│   │   │   ├── VanStatusTile.tsx         # Active/last van with placeholder state
│   │   │   └── DashboardTile.tsx         # Base wrapper component
│   │   ├── onboarding/      # Onboarding flow (10 components)
│   │   │   ├── OnboardingModal.tsx       # 6-step wizard with database persistence
│   │   │   ├── TourGuide.tsx             # Interactive 6-stop dashboard tour
│   │   │   ├── TourHighlight.tsx         # Highlight with adaptive positioning
│   │   │   ├── WelcomeStep.tsx           # Welcome screen
│   │   │   ├── PayRatesStep.tsx          # Pay rates configuration
│   │   │   ├── InvoicingStep.tsx         # Invoicing service selection
│   │   │   ├── VanHireStep.tsx           # Van hire options
│   │   │   ├── VanHireFormStep.tsx       # Van details form
│   │   │   ├── SuccessStep.tsx           # Completion screen
│   │   │   └── SampleDataBadge.tsx       # Floating badge during tour
│   │   ├── settings/        # Settings forms
│   │   └── shared/          # Reusable components
│   ├── lib/
│   │   ├── api/
│   │   │   ├── weeks.ts          # Week/work day API functions
│   │   │   └── vans.ts           # Van hire API functions
│   │   ├── supabase.ts           # Supabase client
│   │   ├── calculations.ts       # Pay calculation utilities (750+ lines)
│   │   ├── dates.ts              # Week calculations & formatting (400+ lines)
│   │   └── utils.ts              # General utilities
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores (auth, settings, calendar, weeks, van)
│   ├── types/               # TypeScript types
│   │   ├── database.ts           # Auto-generated Supabase types
│   │   └── index.ts              # Extended types (350 lines)
│   ├── pages/               # Route pages (Auth, Dashboard, Calendar, Settings, VanManagement)
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
- [x] Build week navigation (previous/next/today)
- [x] URL-based navigation with query parameters
- [x] Create day cell component
- [x] Add day type selection
- [x] Make responsive for mobile
- [x] PaymentThisWeek component showing Week N-2 and Week N-6
- [x] Missing rankings reminder with navigation

### Phase 7: Day Management ✅ **COMPLETE**

- [x] Create day detail modal
- [x] Add notes functionality
- [x] Display calculated pay per day
- [x] Implement day data persistence with Supabase
- [x] Color-coded sweep inputs (green for helping, red for being helped)
- [x] Integer-only mileage inputs
- [x] Custom NumberInput component with chevron arrows
- [x] 6-day work limit validation
- [x] Auto-populate with user settings defaults

### Phase 8: Bonus System ✅ **COMPLETE**

- [x] Create bonus input UI
- [x] Build performance dropdowns (5 levels each)
- [x] Implement bonus calculation logic
- [x] Implement 6-week delay calculation
- [x] Display bonus indicators
- [x] Edit functionality for correcting rankings
- [x] Rankings availability logic (Week N+2)
- [x] Automatic bonus amount calculation

### Phase 9: Sweeping System ✅ **COMPLETE**

- [x] Create sweep log UI
- [x] Add stops given/taken inputs
- [x] Calculate sweep balances
- [x] Display sweep totals
- [x] Clear language ("you helped" vs "helped you")
- [x] NumberInput components with +/- buttons

### Phase 10: Week Summary & Data Management ✅ **COMPLETE**

- [x] Complete pay breakdown display
- [x] Weekly mileage rate adjustment (editable inline)
- [x] Mileage discrepancy calculations and warnings
- [x] Clear week functionality with confirmation
- [x] Invoicing service snapshot per week
- [x] Historical data integrity (rate changes don't affect past weeks)

### Phase 11: Pay Calculations Engine ✅ **COMPLETE**

- [x] Build core pay calculation function
- [x] Implement all rate calculations (Normal/DRS/mileage)
- [x] Integrate bonus calculations
- [x] Apply sweep adjustments
- [x] Calculate van deductions
- [x] Calculate invoicing costs
- [x] Weekly pay breakdown function
- [x] Mileage discrepancy calculations

### Phase 12: Van Hire Management ✅ **COMPLETE**

**All tasks completed!** Van management is fully functional with pro-rata calculations and intelligent deposit tracking.

- [x] Create van management UI (separate page with cards)
- [x] Implement on-hire/off-hire functionality
- [x] Calculate pro-rata costs for partial weeks
- [x] Build deposit tracker with chronological calculation
- [x] Display deposit progress (summary card with progress bar)
- [x] Support multiple vans per week
- [x] Add manual deposit adjustment feature
- [x] Custom delete confirmation modal
- [x] Auto-dismiss toasts
- [x] Integrate van costs into weekly pay breakdowns
- [x] Van hire card component with status badges
- [x] Edit functionality for all van details

### Phase 13: Dashboard & Reports ✅ **COMPLETE**

**All tasks completed!** Dashboard is fully functional with 6 interactive tiles.

- [x] Create main dashboard layout with responsive grid
- [x] Build Quick Add Work tile (create/edit with cache sync)
- [x] Build Quick Add Sweeps tile (with edit mode and color coding)
- [x] Build Quick Add Odometer tile (with edit mode and yellow theme)
- [x] Build Payment tile (Week N-2 + N-6 breakdown)
- [x] Build Rankings Reminder tile (with smart placeholders)
- [x] Build Van Status tile (active/last van with quick off-hire)
- [x] Implement responsive tile ordering (mobile vs desktop)
- [x] Add consistent button sizing and positioning
- [x] Integrate with weeks store for real-time cache sync
- [x] Add dual mileage display to calendar day cells
- [x] Make NumberInput components null-safe and consistent throughout

### Phase 14: Validation & UX Improvements ✅ **COMPLETE**

**All tasks completed!** Comprehensive validation, notifications, and confirmations implemented.

- [x] Create reusable ConfirmationDialog component with variants (default, warning, destructive)
- [x] Add delete work day confirmation with AlertTriangle icon
- [x] Implement toast notifications for Auth flow (success/error messages)
- [x] Add Zod validation to Auth forms (login and signup)
- [x] Add date range validation for van hire (off-hire cannot be before on-hire)
- [x] Fix manual deposit double-counting bug with deposit_calculation_start_date
- [x] Add Clear Deposits button for error correction
- [x] Remove per-van deposit display (deposits are cumulative across all vans)
- [x] Update VanStatusTile to show totalDepositPaid from store
- [x] Filter MANUAL_DEPOSIT_ADJUSTMENT from weekly summary van breakdown
- [x] Standardize existing confirmation dialogs (Clear Week, Delete Van Hire)

### Phase 15: UI/UX Polish ✅ **COMPLETE**

- [x] Make fully responsive
  - [x] Fix horizontal scrolling on small iOS devices (320-360px)
  - [x] Optimize for small screens (dashboard header, edit buttons)
  - [x] Mobile-first responsive layouts throughout
  - [x] Responsive tile ordering (mobile vs desktop)
- [x] Add animations and transitions
  - [x] Add smooth page transitions between routes
  - [x] Add modal entrance/exit animations (scale + fade)
  - [x] Add dashboard tile animations (staggered fade-in/slide-up)
  - [x] Add button hover/active states with subtle scale
  - [x] Add cursor pointer to all interactive buttons
- [x] Create onboarding flow
  - [x] Welcome screen for new users
  - [x] Initial settings wizard (6-step guided flow)
  - [x] Feature tour with interactive highlights (6 dashboard stops)
  - [x] Sample data mode during tour
  - [x] Skip functionality with confirmation
  - [x] Database-backed completion tracking per user
- [x] Improve accessibility ✅ **WCAG 2.1 AA (90-95% Compliant)**
  - [x] ARIA labels on all icon-only buttons (9 components)
  - [x] Semantic HTML with proper heading hierarchy (h1 on all pages)
  - [x] Focus states on all inputs/buttons with visible indicators
  - [x] Screen reader support with skip navigation link
  - [x] Autocomplete attributes for password managers
  - [x] Viewport zoom enabled (removed user-scalable=no)
  - [x] Reduced motion support (prefers-reduced-motion media query)
  - [x] Keyboard accessibility (all interactive elements accessible via Tab)
  - [x] WCAG 2.1 AA compliance audit completed
  - [ ] Manual testing with screen readers (NVDA/VoiceOver) - recommended
  - [ ] Color contrast verification - recommended
- [ ] Implement keyboard shortcuts (future enhancement)
  - [ ] Week navigation (arrow keys, today shortcut)
  - [ ] Quick add work (keyboard shortcut)
  - [ ] Calendar shortcuts (n for new day, e for edit)

### Phase 16: Testing & Deployment ⏳ **IN PROGRESS**

- [ ] Test all calculations
- [ ] Test multi-user isolation
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [x] Deploy to Netlify (production)
- [x] WCAG 2.1 AA accessibility audit (90-95% compliant)
- [ ] Manual accessibility testing (screen reader, keyboard-only)
- [ ] Color contrast verification (both themes)
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
