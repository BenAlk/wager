# Wager 💰

A comprehensive pay tracking and schedule management application for Amazon DSP couriers.

## Overview

**Wager** is designed to help Amazon DSP couriers accurately track their weekly pay, including complex calculations for bonuses, sweep adjustments, van rentals, and deposits. The app provides a visual calendar interface to plan rotas and predict expected earnings with precision.

## Problem Statement

As a courier working for a DSP (Delivery Service Partner) that works with Amazon, tracking pay can be complex due to:

- Variable daily rates based on days worked per week
- 6-week delayed bonus system with multiple tier combinations
- Sweep adjustments (stops given/taken from other drivers)
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

### 💵 Pay Tracking

- **Normal Routes**: £160/day (customizable in settings)
- **DRS/Missort Routes**: £100/day (customizable in settings)
- **6-Day Bonus**: Flat £30 bonus (6 × £5) when working exactly 6 days
- **Pay Timing**: Standard pay 2 weeks in arrears (Week N+2), bonuses 6 weeks delayed (Week N+6)
- Real-time pay calculations

### 🎯 Bonus System

- 5 performance levels: Poor, Fair, Great, Fantastic, Fantastic+
- Individual and company performance tracking
- Bonus tiers:
  - Both Fantastic+: £12/day
  - Mixed Fantastic/Fantastic+: £8/day
- 6-week delay calculation (Week 33 bonus paid in Week 39)

### 🚚 Sweep Tracking

- Log stops given to other drivers (+£1 per stop)
- Log stops taken from you (-£1 per stop)
- Max 200 sweeps per day (total stops given + taken)
- Weekly sweep balance calculation
- Paid with standard pay (Week N+2)
- Running totals in dashboard

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

- **Vercel/Netlify** - Frontend hosting
- **Supabase** - Backend infrastructure

## Project Structure

```
wager/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn UI components
│   │   ├── calendar/        # Calendar view components
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
│   │   ├── supabase.ts      # Supabase client
│   │   ├── calculations.ts  # Pay calculation utilities
│   │   └── utils.ts         # General utilities
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── pages/               # Route pages
│   └── App.tsx
├── supabase/
│   └── migrations/          # Database migrations
└── package.json
```

## Development Roadmap

### Phase 1: Setup & Foundation ✅

- [x] Initialize Vite + React + TypeScript project
- [x] Install all dependencies (React Router, Zustand, date-fns, Supabase, etc.)
- [x] Set up Tailwind CSS v4 configuration
- [x] Create folder structure (components, features, lib, hooks, store, types, pages)
- [x] Set up shadcn/ui and install 15 components (Button, Card, Input, Form, etc.)
- [x] Create `src/lib/utils.ts` helper function (cn utility)
- [x] Configure path aliases (@/* imports)
- [ ] Set up Supabase project
- [ ] Configure Supabase client
- [ ] Set up environment variables
- [ ] Create base TypeScript types

### Phase 2: Database Design

- [ ] Design complete database schema
- [ ] Create database tables (user_settings, weeks, days, sweeps, van_hires)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create database indexes
- [ ] Write migration files
- [ ] Test database connections

### Phase 3: Core Configuration & Utils

- [ ] Create TypeScript interfaces for all data models
- [ ] Set up Zustand store structure
- [ ] Create calculation utilities
- [ ] Create date helper functions
- [ ] Set up React Router structure

### Phase 4: Authentication

- [ ] Create auth context/provider
- [ ] Build login/signup pages
- [ ] Implement Supabase authentication
- [ ] Set up protected routes
- [ ] Add logout functionality
- [ ] Handle auth state persistence

### Phase 5: Settings Management

- [ ] Create settings page layout
- [ ] Build rate configuration forms
- [ ] Build bonus level configuration
- [ ] Implement save/load settings
- [ ] Add validation and error handling

### Phase 6: Calendar Core

- [ ] Create weekly calendar component
- [ ] Implement week number calculation
- [ ] Build week navigation
- [ ] Create day cell component
- [ ] Add day type selection
- [ ] Make responsive for mobile

### Phase 7: Day Management

- [ ] Create day detail modal
- [ ] Add notes functionality
- [ ] Display calculated pay per day
- [ ] Implement day data persistence

### Phase 8: Bonus System

- [ ] Create bonus input UI
- [ ] Build performance dropdowns
- [ ] Implement bonus calculation logic
- [ ] Implement 6-week delay calculation
- [ ] Display bonus indicators

### Phase 9: Sweeping System

- [ ] Create sweep log UI
- [ ] Add stops given/taken inputs
- [ ] Calculate sweep balances
- [ ] Display sweep totals
- [ ] Create sweep history

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
- [ ] Deploy to production
- [ ] Beta testing with team

## Contributing

This project is currently in active development. Contributions, issues, and feature requests are welcome!

## License

MIT

## Author

Ben Alkureishi

---

**Status**: 🚧 In Development
**Version**: 0.1.0 (MVP)
