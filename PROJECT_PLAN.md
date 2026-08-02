# Wager V2 - Project Plan

**Created:** February 9, 2026
**Status:** Planning Complete - Ready to Begin

---

## Overview

This plan outlines the development of Wager V2, transforming from a driver-focused pay tracking tool to a depot management platform. The MVP targets:
- 1 DSP organization
- 1 OPM + 4-5 sub-managers
- 20+ drivers

---

## Phase 0: Project Setup
**Duration:** 1-2 days
**Goal:** Repository and development environment ready

### Milestone: Development Environment Ready

| Task | Status | Notes |
|------|--------|-------|
| Create `wager-v2` repository | [ ] | Fresh Vite + React 19 + TypeScript |
| Configure Tailwind v4 | [ ] | Copy design tokens from V1 |
| Install shadcn/ui components | [ ] | Button, Input, Card, Dialog, etc. |
| Set up Zustand stores | [ ] | Auth, UI, toast stores |
| Configure React Hook Form + Zod | [ ] | Form validation patterns |
| Copy V1 utilities | [ ] | `dates.ts`, `calculations.ts` |
| Set up i18n infrastructure | [ ] | Copy from V1, configure namespaces |
| Configure ESLint + Prettier | [ ] | Code quality standards |
| Set up Vitest | [ ] | Unit testing framework |

### Deliverables
- [ ] Running dev server at `localhost:5173`
- [ ] Basic page routing (Login, Dashboard placeholders)
- [ ] Component library ready

---

## Phase 1: Foundation (Database & Auth)
**Duration:** 3-4 days
**Goal:** Supabase schema and auth flow working

### Milestone 1.1: Database Schema Deployed

| Task | Status | Notes |
|------|--------|-------|
| Design organizations table | [ ] | `id`, `name`, `active` |
| Design depots table | [ ] | `id`, `org_id`, `name`, `active` |
| Design depot_settings table | [ ] | Normal rate, DRS rate, custom rates |
| Design users table | [ ] | Email, display name, Amazon transporter ID |
| Design depot_memberships table | [ ] | User + depot + role + active/coverage |
| Design weeks table | [ ] | Week number, year, mileage rate |
| Design depot_weeks table | [ ] | Depot performance per week |
| Design user_weeks table | [ ] | Individual performance, invoicing |
| Design routes table | [ ] | Route assignments per day |
| Design sweep_logs table | [ ] | Driver sweeps, approval status |
| Design van_fleet table | [ ] | Depot fleet inventory |
| Design van_assignments table | [ ] | Driver to van assignments |
| Design van_deposits table | [ ] | Deposit tracking |
| Design availability_requests table | [ ] | Time-off requests |
| Design absences table | [ ] | Manager-logged absences |
| Design daily_quotas table | [ ] | Drivers needed per day |
| Write migration scripts | [ ] | Supabase SQL migrations |
| Deploy to Supabase | [ ] | Development project |

### Milestone 1.2: RLS Policies Active

| Task | Status | Notes |
|------|--------|-------|
| RLS: Users can read own profile | [ ] | `auth.uid() = id` |
| RLS: Users can read own depot(s) | [ ] | Via depot_memberships |
| RLS: Drivers can read assigned routes | [ ] | Via depot membership |
| RLS: Drivers can insert sweep logs | [ ] | Own user_id only |
| RLS: Drivers can read own sweeps | [ ] | `user_id = auth.uid()` |
| RLS: Managers can read depot data | [ ] | OPM/Admin role check |
| RLS: Managers can insert/update routes | [ ] | Depot membership + role |
| RLS: Managers can update sweep status | [ ] | Depot membership + role |
| RLS: Owner role has full access | [ ] | Org-level access |
| Test RLS isolation | [ ] | Verify no cross-user leakage |

### Milestone 1.3: Auth Flow Working

| Task | Status | Notes |
|------|--------|-------|
| Configure Supabase Auth | [ ] | Email + magic link |
| Create login page | [ ] | Email input, magic link flow |
| Create password set page | [ ] | For invited users |
| Implement auth store (Zustand) | [ ] | Session, user, loading state |
| Protected route wrapper | [ ] | Redirect to login if not auth'd |
| Role-based route guards | [ ] | Driver vs Manager routes |
| Logout functionality | [ ] | Clear session, redirect |

### Deliverables
- [ ] Database schema deployed to Supabase dev
- [ ] RLS policies passing isolation tests
- [ ] Login/logout flow working
- [ ] Role detection after login

---

## Phase 2: Excel Parsing & Data Import
**Duration:** 3-4 days
**Goal:** Manager can upload Excel files and create route assignments

### Milestone 2.1: Excel Parser Working

| Task | Status | Notes |
|------|--------|-------|
| Install xlsx library | [ ] | For Excel parsing |
| Create Routes file parser | [ ] | Extract route code, transporter ID, stops, etc. |
| Create Staging Areas file parser | [ ] | Extract staging, dispatch time |
| Map delivery service type → route type | [ ] | Standard Parcel → Normal, etc. |
| Handle file validation errors | [ ] | Missing columns, bad format |
| Combine Routes + Staging data | [ ] | Merge by route code |
| Write parser unit tests | [ ] | Various file formats |

### Milestone 2.2: Driver Matching Working

| Task | Status | Notes |
|------|--------|-------|
| Match by Transporter ID | [ ] | Link to user's Amazon driver ID |
| Handle unmatched drivers | [ ] | Show warning, allow skip |
| Handle new drivers in file | [ ] | Prompt to create or skip |
| Batch upsert routes | [ ] | Create/update for the day |
| Update existing day's routes | [ ] | Replace vs merge strategy |

### Milestone 2.3: Upload UI Complete

| Task | Status | Notes |
|------|--------|-------|
| File upload component | [ ] | Drag-and-drop + file picker |
| Upload progress indicator | [ ] | Parsing, matching, saving |
| Preview before save | [ ] | Show matched routes |
| Success/error toast messages | [ ] | Feedback on upload result |
| Upload history list | [ ] | View past uploads |

### Deliverables
- [ ] Manager can upload Routes + Staging Excel files
- [ ] Routes are created for the day with correct driver assignments
- [ ] Unmatched drivers are highlighted for action

---

## Phase 3: Manager Dashboard
**Duration:** 4-5 days
**Goal:** Manager can perform all daily management tasks

### Milestone 3.1: Driver Management

| Task | Status | Notes |
|------|--------|-------|
| Driver list view | [ ] | All drivers in depot |
| Add new driver form | [ ] | Name, email, transporter ID |
| Send invite email | [ ] | Magic link or set password |
| Edit driver details | [ ] | Name, email, transporter ID |
| Deactivate driver | [ ] | Soft delete, remove access |
| Reactivate driver | [ ] | Restore access |
| Driver detail view | [ ] | Profile, assignments, history |

### Milestone 3.2: Route Management

| Task | Status | Notes |
|------|--------|-------|
| Daily routes view | [ ] | All routes for selected date |
| Date picker navigation | [ ] | Today, tomorrow, calendar |
| Manual route creation | [ ] | Add route without Excel |
| Edit route assignment | [ ] | Change driver, rate override |
| Delete route | [ ] | Remove assignment |
| Route detail modal | [ ] | Full route info |

### Milestone 3.3: Sweep Approval

| Task | Status | Notes |
|------|--------|-------|
| Pending sweeps list | [ ] | All pending in depot |
| Sweep detail view | [ ] | Who, from whom, stops |
| Approve sweep action | [ ] | Update status, apply to calcs |
| Reject sweep action | [ ] | Require reason, notify driver |
| Sweep history view | [ ] | Approved/rejected log |

### Milestone 3.4: Availability Management

| Task | Status | Notes |
|------|--------|-------|
| Pending requests list | [ ] | Awaiting approval |
| Request detail view | [ ] | Driver, dates, type |
| Approve/reject request | [ ] | Update status |
| Daily availability view | [ ] | Who's working vs off |
| Log absence | [ ] | Sick, no-show, other |
| Set daily quota | [ ] | Drivers needed per day |

### Milestone 3.5: Van Management

| Task | Status | Notes |
|------|--------|-------|
| Fleet list view | [ ] | All vans in depot |
| Add van to fleet | [ ] | Registration, type, rate |
| Edit van details | [ ] | Update status, rate |
| Remove van from fleet | [ ] | Mark as off-fleet |
| Van assignments view | [ ] | Current driver assignments |
| Assign van to driver | [ ] | Fleet, Flexi, or driver-owned |
| Update deposit | [ ] | Track progress toward £500 |

### Deliverables
- [ ] Manager can manage drivers (CRUD)
- [ ] Manager can view/edit route assignments
- [ ] Manager can approve/reject sweeps
- [ ] Manager can handle availability requests
- [ ] Manager can manage van fleet and assignments

---

## Phase 4: Driver Dashboard
**Duration:** 3-4 days
**Goal:** Driver can view assignments and submit logs

### Milestone 4.1: Today's Assignment

| Task | Status | Notes |
|------|--------|-------|
| Today's route card | [ ] | Route number, type, staging |
| Dispatch time display | [ ] | Prominent visibility |
| Stop count display | [ ] | Total stops for the day |
| No assignment state | [ ] | Clear "day off" message |
| Week view toggle | [ ] | See upcoming assignments |

### Milestone 4.2: Sweep Logging

| Task | Status | Notes |
|------|--------|-------|
| "Log Sweep" button | [ ] | Prominent action |
| Driver dropdown | [ ] | Drivers working that day |
| Stop count input | [ ] | Number validation |
| Submit sweep form | [ ] | Create pending sweep |
| My sweeps list | [ ] | View all with status |
| Rejection reason view | [ ] | Why sweep was denied |

### Milestone 4.3: Time-Off Requests

| Task | Status | Notes |
|------|--------|-------|
| Request time off button | [ ] | Accessible action |
| Date picker for request | [ ] | Single or range |
| Submit request | [ ] | Check auto-approval rules |
| My requests list | [ ] | View all with status |
| Cancel request | [ ] | Before it's approved |

### Milestone 4.4: Van & Pay Info

| Task | Status | Notes |
|------|--------|-------|
| Current van assignment | [ ] | Registration, type |
| Enter driver-owned van | [ ] | Make + registration form |
| Deposit progress | [ ] | Bar toward £500 |
| Pay breakdown view | [ ] | Read-only, weekly summary |
| Invoicing service setting | [ ] | Self/Verso Basic/Verso Full |

### Milestone 4.5: Profile Settings

| Task | Status | Notes |
|------|--------|-------|
| Language selector | [ ] | 9 language options |
| Display name edit | [ ] | Personal preference |
| Change password | [ ] | Security setting |
| View profile info | [ ] | Email, transporter ID |

### Deliverables
- [ ] Driver sees today's route and staging area
- [ ] Driver can log sweeps and see approval status
- [ ] Driver can request time off
- [ ] Driver can view van assignment and pay info
- [ ] Driver can manage personal settings

---

## Phase 5: MVP Polish
**Duration:** 3-4 days
**Goal:** Production-ready quality for trial

### Milestone 5.1: Pay Calculations

| Task | Status | Notes |
|------|--------|-------|
| Copy V1 calculation logic | [ ] | All rate logic |
| Integrate with V2 data model | [ ] | Routes, sweeps, van hire |
| Weekly summary component | [ ] | Reuse from V1 |
| Calculate with approved sweeps | [ ] | Apply stops taken/given |
| Test calculation accuracy | [ ] | Compare with V1 results |

### Milestone 5.2: Mobile Optimization

| Task | Status | Notes |
|------|--------|-------|
| Responsive layouts | [ ] | All pages mobile-first |
| Touch-friendly buttons | [ ] | Minimum 44px targets |
| Swipe navigation (if needed) | [ ] | Date/week navigation |
| Test on actual devices | [ ] | iOS Safari, Android Chrome |
| PWA configuration | [ ] | Installable on mobile |

### Milestone 5.3: Error Handling

| Task | Status | Notes |
|------|--------|-------|
| Form validation messages | [ ] | All forms have feedback |
| API error handling | [ ] | Toast notifications |
| Network error recovery | [ ] | Retry logic, offline state |
| Session expiry handling | [ ] | Redirect to login |
| Loading states | [ ] | Skeleton/spinner UX |

### Milestone 5.4: Testing

| Task | Status | Notes |
|------|--------|-------|
| Unit tests: Parsers | [ ] | Excel parsing edge cases |
| Unit tests: Calculations | [ ] | Pay calculation accuracy |
| Unit tests: Date utilities | [ ] | Week structure logic |
| Integration tests: Auth | [ ] | Login/logout flows |
| RLS isolation tests | [ ] | Cross-user data protection |
| End-to-end tests | [ ] | Critical user flows |

### Milestone 5.5: Documentation

| Task | Status | Notes |
|------|--------|-------|
| Manager quick-start guide | [ ] | How to upload, manage drivers |
| Driver quick-start guide | [ ] | How to view route, log sweep |
| API documentation | [ ] | Internal reference |
| Database schema docs | [ ] | ERD diagram |
| Deployment guide | [ ] | How to deploy to production |

### Deliverables
- [ ] Pay calculations working correctly
- [ ] Mobile experience polished
- [ ] Error handling comprehensive
- [ ] Test coverage adequate
- [ ] Documentation complete

---

## Phase 6: Trial Deployment
**Duration:** 1-2 weeks (ongoing)
**Goal:** Deploy to trial users and gather feedback

### Milestone 6.1: Production Setup

| Task | Status | Notes |
|------|--------|-------|
| Create production Supabase project | [ ] | Separate from dev |
| Configure production domain | [ ] | SSL, DNS |
| Deploy frontend | [ ] | Vercel or similar |
| Environment configuration | [ ] | Production env vars |
| Database migration | [ ] | Apply schema to prod |
| Create initial OPM account | [ ] | First manager access |

### Milestone 6.2: Trial Onboarding

| Task | Status | Notes |
|------|--------|-------|
| OPM training session | [ ] | Walk through manager flow |
| Create sub-manager accounts | [ ] | 4-5 accounts |
| Import initial driver list | [ ] | 20+ drivers |
| Send driver invites | [ ] | Magic link emails |
| First Excel upload test | [ ] | Verify parsing works |

### Milestone 6.3: Trial Monitoring

| Task | Status | Notes |
|------|--------|-------|
| Set up error tracking | [ ] | Sentry or similar |
| Monitor usage patterns | [ ] | Which features used |
| Collect user feedback | [ ] | Form or direct comms |
| Track issues reported | [ ] | Bug list |
| Daily check-ins (first week) | [ ] | Quick support calls |

### Milestone 6.4: Trial Iteration

| Task | Status | Notes |
|------|--------|-------|
| Prioritize reported issues | [ ] | Critical vs nice-to-have |
| Fix critical bugs | [ ] | Immediate patches |
| Minor improvements | [ ] | Quick wins from feedback |
| Document lessons learned | [ ] | For Phase 7 planning |

### Success Criteria Checklist

**Manager Success:**
- [ ] Can upload daily Excel files successfully
- [ ] Route assignments appear correctly for all drivers
- [ ] Can approve/reject sweep logs
- [ ] Can manage driver accounts (create, edit, deactivate)
- [ ] Can view availability requests

**Driver Success:**
- [ ] Can log in and see their route
- [ ] Route shows correct staging area
- [ ] Can log sweeps and see approval status
- [ ] Can request time off
- [ ] Can view their pay breakdown

**Technical Success:**
- [ ] Data matches between Excel upload and driver view
- [ ] No cross-user data leakage (RLS working)
- [ ] Performance acceptable (<2s page loads)
- [ ] Mobile-friendly (drivers use phones)

### Deliverables
- [ ] Production environment running
- [ ] Trial users onboarded
- [ ] Feedback collected and processed
- [ ] Critical issues resolved

---

## Phase 7: Post-MVP Features
**Duration:** TBD (after successful trial)
**Goal:** Expand functionality based on trial feedback

### Potential Features (prioritize based on trial feedback)

| Feature | Priority | Notes |
|---------|----------|-------|
| Performance rankings upload | High | Manager uploads weekly rankings |
| Weekly policies (Cognito) | High | Form integration |
| Multi-depot support | Medium | Expand to other depots |
| Finance role & reports | Medium | Pay reports, exports |
| Manager coverage toggle | Medium | Temporarily cover other depot |
| Advanced analytics | Low | Charts, trends |
| Notifications | Low | Push/email for approvals |
| Audit logging | Low | Track who changed what |

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Setup | 1-2 days | 2 days |
| Phase 1: Foundation | 3-4 days | 6 days |
| Phase 2: Excel Parsing | 3-4 days | 10 days |
| Phase 3: Manager Dashboard | 4-5 days | 15 days |
| Phase 4: Driver Dashboard | 3-4 days | 19 days |
| Phase 5: MVP Polish | 3-4 days | 23 days |
| **Total to MVP Ready** | **~4-5 weeks** | |
| Phase 6: Trial | 1-2 weeks | 5-7 weeks |
| Phase 7: Post-MVP | TBD | Ongoing |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Excel format changes | High | Validate file structure, flexible parser |
| RLS complexity | High | Thorough testing, simple policies |
| Driver adoption | Medium | Simple UX, manager training |
| Performance with scale | Medium | Optimize queries, pagination |
| Multi-depot complexity | Low | Start with single depot MVP |

---

## Dependencies

| Dependency | Needed By | Notes |
|------------|-----------|-------|
| Supabase project | Phase 1 | Development environment |
| Sample Excel files | Phase 2 | For parser testing |
| Domain name | Phase 6 | Production deployment |
| Manager availability | Phase 6 | Training, feedback |
| Driver email list | Phase 6 | For invites |

---

*Last updated: February 9, 2026*
