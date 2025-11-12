# Wager - Design System & Principles

**Status**: Updated Jan 12, 2025 - Dual theme system implemented

## Design Philosophy

Wager is built for couriers who need quick, accurate information about their pay. The design should be:

- **Professional yet approachable**: This is a financial tool, but not corporate
- **Information-dense without clutter**: Show what matters, hide what doesn't
- **Fast to scan**: Couriers are busy - key numbers should jump out
- **Mobile-first mindset**: Many couriers will check on their phones
- **Confident and trustworthy**: Handling pay data requires user confidence

**Core Principle**: "Designed for couriers, by a courier" - this isn't a generic app, it's purpose-built.

---

## Color Palette

### Primary Colors

**Blue** - Trust, stability, professionalism

- `blue-400`: `#60a5fa` - Accents, links
- `blue-500`: `#3b82f6` - Primary actions, gradients
- `blue-600`: `#2563eb` - Hover states

**Emerald** - Growth, earnings, positive outcomes

- `emerald-400`: `#34d399` - Success indicators
- `emerald-500`: `#10b981` - Gradients, positive values
- `emerald-600`: `#059669` - Hover states

**Gradient**: `from-blue-500 to-emerald-500`

- Used for: Primary CTAs, logo, headings
- Represents: Journey from work (blue) to earnings (emerald)

### Neutral Colors

**Slate** - Dark theme base colors

- `slate-400`: `#94a3b8` - Secondary text (dark theme)
- `slate-500`: `#64748b` - Tertiary text, placeholders
- `slate-700`: `#334155` - Dark surfaces
- `slate-800`: `#1e293b` - Dark backgrounds (via)
- `slate-900`: `#0f172a` - Primary dark background

**Stone** - Light theme base colors (warm, no flashbang)

- `stone-50`: `#fafaf9` - Light backgrounds (via)
- `stone-100`: `#f5f5f4` - Primary light background
- `stone-600`: `#57534e` - Tertiary text (light theme)
- `stone-700`: `#44403c` - Secondary text (light theme)
- `stone-900`: `#1c1917` - Primary text (light theme)

### Theme System Implementation

**Default Theme**: Dark mode (courier-friendly for early mornings/night shifts)

**Dark Theme**:
- Background: `gradient-to-br from-slate-900 via-slate-800 to-slate-900`
- Cards: `bg-white/10` with `backdrop-blur-xl`
- Borders: `border-white/20` or `border-white/10`
- Modals: `rgba(15, 23, 42, 0.95)` - 95% opaque slate
- Text: White primary, slate-400 secondary

**Light Theme**:
- Background: `gradient-to-br from-stone-100 via-stone-50 to-stone-100`
- Cards: `bg-white/80` with `backdrop-blur-xl`
- Borders: `border-black/12` or `border-black/08`
- Modals: `rgba(250, 250, 249, 0.98)` - 98% opaque warm white
- Text: Stone-900 primary, stone-700 secondary

**Implementation**:
- All colors use CSS custom properties (CSS variables)
- Theme switching via class on `<html>` element (`.dark` or `.light`)
- Persistence via localStorage with Zustand
- 40+ components converted to use theme variables

### Semantic Colors

**Success** - Positive pay adjustments, completed actions

- Green: `emerald-500`
- Usage: +£72 bonus, sweep earnings, deposit complete

**Warning** - Attention needed, upcoming deadlines

- Amber: `amber-500` (`#f59e0b`)
- Usage: "Enter Week 39 rankings", deposit due

**Error** - Negative adjustments, issues

- Red: `red-500` (`#ef4444`)
- Usage: -£5 sweep loss, van damage deduction

**Info** - Neutral information, explanations

- Sky: `sky-500` (`#0ea5e9`)
- Usage: Tooltips, help text, informational badges

---

## Typography

### Font Family

- **Primary**: System font stack for performance
  - `font-sans`: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`
- **Monospace** (for currency, numbers): `font-mono`

### Font Weights

- `font-normal` (400): Body text
- `font-medium` (500): Labels, subtle emphasis
- `font-semibold` (600): Buttons, card headings
- `font-bold` (700): Page headings, important values

### Font Sizes

- `text-xs` (0.75rem): Helper text, footnotes
- `text-sm` (0.875rem): Labels, secondary text
- `text-base` (1rem): Body text
- `text-lg` (1.125rem): Emphasized body text
- `text-xl` (1.25rem): Subheadings
- `text-2xl` (1.5rem): Card headings
- `text-3xl` (1.875rem): Section headings
- `text-4xl` (2.25rem): Page titles, hero text

### Typography Usage

- **Currency values**: `font-mono font-bold` - makes numbers scannable
- **Headings**: `font-bold text-white`
- **Body text**: `text-slate-400` (dark mode) or `text-slate-600` (light)
- **Labels**: `text-sm font-medium text-slate-200`

---

## Spacing System

Use Tailwind's default spacing scale (based on 0.25rem / 4px):

- `gap-2` (8px): Tight groupings (icon + label)
- `gap-3` (12px): Form field spacing
- `gap-4` (16px): Card internal spacing
- `gap-6` (24px): Section spacing
- `gap-8` (32px): Major section breaks
- `gap-12` (48px): Page-level spacing

**Padding**:

- Cards: `p-6` to `p-8`
- Buttons: `py-3 px-4` (medium) or `py-2.5 px-3` (small)
- Inputs: `py-3 px-4`

**Margins**:

- Use `space-y-*` for vertical stacks
- Use `gap-*` for flex/grid layouts

---

## Components

### Buttons

**Primary Button** (main actions):

```jsx
className="bg-gradient-to-r from-blue-500 to-emerald-500
  hover:from-blue-600 hover:to-emerald-600
  text-white font-semibold py-3 px-6 rounded-lg
  shadow-lg shadow-blue-500/25
  transition-all transform hover:scale-[1.02] active:scale-[0.98]"
```

**Secondary Button** (alternative actions):

```jsx
className="bg-white/5 hover:bg-white/10
  border border-white/10 text-white
  py-3 px-6 rounded-lg transition-all"
```

**Ghost Button** (tertiary actions):

```jsx
className="text-blue-400 hover:text-blue-300
  transition-colors"
```

### Cards

**Glassmorphic Card** (main content container):

```jsx
className="bg-white/10 backdrop-blur-xl
  border border-white/20 rounded-2xl
  shadow-2xl p-8"
```

**Subtle Card** (nested content):

```jsx
className="bg-white/5 backdrop-blur-sm
  border border-white/10 rounded-lg p-4"
```

### Form Fields

**Input Field**:

```jsx
className="w-full bg-white/5 border border-white/10
  rounded-lg px-4 py-3 text-white
  placeholder-slate-500
  focus:outline-none focus:ring-2 focus:ring-blue-500
  focus:border-transparent transition-all"
```

**Input with Icon**:

- Icon: `absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`
- Input: Add `pl-11` for left padding

**Label**:

```jsx
className = 'text-sm font-medium text-slate-200 block'
```

### Badges & Tags

**Status Badge**:

```jsx
// Success
className="px-3 py-1 bg-emerald-500/20
  text-emerald-400 rounded-full text-sm font-medium"

// Warning
className="px-3 py-1 bg-amber-500/20
  text-amber-400 rounded-full text-sm font-medium"

// Neutral
className="px-3 py-1 bg-slate-500/20
  text-slate-400 rounded-full text-sm font-medium"
```

### Icons

**Icon Container** (small decorative backgrounds):

```jsx
className="w-8 h-8 bg-blue-500/20 rounded-lg
  flex items-center justify-center"
```

**Icon Size**:

- Small: `w-4 h-4`
- Medium: `w-5 h-5` (most common)
- Large: `w-6 h-6` or `w-7 h-7`

**Icon Library**: `lucide-react`

- Consistent stroke width
- Clean, modern aesthetic
- Wide variety of courier-relevant icons

### Confirmation Dialogs

**Reusable ConfirmationDialog Component**:

```jsx
<ConfirmationDialog
  open={showConfirm}
  onOpenChange={setShowConfirm}
  onConfirm={handleConfirm}
  title="Delete Work Day?"
  description={<>Detailed explanation with <strong>emphasis</strong></>}
  confirmText="Delete Work Day"
  cancelText="Cancel"
  variant="destructive" // 'default' | 'warning' | 'destructive'
  icon={<AlertTriangle className="w-6 h-6" />}
  isLoading={isDeleting}
/>
```

**Variants**:

- **default**: Blue theme for informational confirmations
- **warning**: Amber theme for caution (not implemented yet)
- **destructive**: Red theme for delete/clear actions

**Usage**:

- Consistent styling across all confirmations
- Icon centered in colored circle background
- Title and description centered
- Loading state with spinner
- Mobile-responsive button layout

---

## Layout Patterns

### Responsive Breakpoints

- `sm:` - 640px (phone landscape)
- `md:` - 768px (tablet portrait)
- `lg:` - 1024px (tablet landscape, small desktop)
- `xl:` - 1280px (desktop)
- `2xl:` - 1536px (large desktop)

**Strategy**: Mobile-first, enhance for larger screens

### Grid Patterns

**Dashboard Grid** (responsive cards):

```jsx
className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
```

**Two-column split**:

```jsx
className = 'flex flex-col lg:flex-row gap-8 lg:gap-12'
```

### Container Widths

- Full page: `max-w-7xl` (1280px)
- Content: `max-w-4xl` (896px)
- Forms: `max-w-md` (448px)
- Always add `mx-auto` for centering

---

## Animations & Transitions

### Transition Classes

- Default: `transition-all` (200ms)
- Colors only: `transition-colors`
- Transform: `transition-transform`

### Hover Effects

**Buttons**:

- Scale: `hover:scale-[1.02] active:scale-[0.98]`
- Background: `hover:bg-white/10`

**Cards**:

- Lift: `hover:shadow-xl hover:-translate-y-1 transition-all`
- Glow: `hover:border-blue-500/50`

**Links**:

- Color shift: `hover:text-blue-300`

### Loading States

- Pulse: `animate-pulse`
- Spin: `animate-spin` (for icons)

---

## Background Effects

### Gradient Background

```jsx
className="min-h-screen bg-gradient-to-br
  from-slate-900 via-slate-800 to-slate-900"
```

### Ambient Glow (decorative):

```jsx
<div className='absolute inset-0 overflow-hidden'>
	<div
		className='absolute -top-1/2 -right-1/2
    w-full h-full bg-blue-500/5
    rounded-full blur-3xl'
	></div>
	<div
		className='absolute -bottom-1/2 -left-1/2
    w-full h-full bg-emerald-500/5
    rounded-full blur-3xl'
	></div>
</div>
```

---

## Data Visualization

### Currency Display

```jsx
// Positive value (earnings)
className = 'text-2xl font-mono font-bold text-emerald-400'

// Negative value (deductions)
className = 'text-2xl font-mono font-bold text-red-400'

// Neutral value
className = 'text-2xl font-mono font-bold text-white'
```

**Format**: Always include £ symbol, use commas for thousands

- Example: `£1,234.56`

### Week Indicators

- Current week: Highlighted with blue gradient
- Past weeks: Muted slate
- Future weeks (predictions): Dashed border

---

## Accessibility

### Focus States

All interactive elements must have visible focus:

```jsx
focus:outline-none focus:ring-2 focus:ring-blue-500
```

### Color Contrast

- White text on dark: `text-white` on `bg-slate-900` (✓ AAA)
- Body text: `text-slate-400` on `bg-slate-900` (✓ AA)
- Never use low-opacity text for critical information

### Screen Readers

- Use semantic HTML (`<button>`, `<label>`, etc.)
- Add `aria-label` for icon-only buttons
- Use `sr-only` class for screen-reader-only text

---

## Examples & Usage

### Hero Section (Landing/Auth pages)

```jsx
<div className='space-y-3'>
	<h2 className='text-3xl lg:text-4xl font-bold text-white'>
		Track Your Pay,
		<br />
		<span
			className='text-transparent bg-clip-text
      bg-gradient-to-r from-blue-400 to-emerald-400'
		>
			Predict Your Earnings
		</span>
	</h2>
	<p className='text-slate-400 text-lg'>
		Built for Amazon DSP couriers. Manage bonuses, sweeps, and van hire costs in
		one place.
	</p>
</div>
```

### Stat Card

```jsx
<div
	className='bg-white/5 backdrop-blur-sm
  border border-white/10 rounded-lg p-4'
>
	<div className='flex items-center justify-between mb-2'>
		<span className='text-sm text-slate-400'>This Week</span>
		<TrendingUp className='w-5 h-5 text-emerald-400' />
	</div>
	<div className='text-3xl font-mono font-bold text-white'>£782.50</div>
	<div className='text-sm text-emerald-400 mt-1'>+£72 from Week 39 bonus</div>
</div>
```

### Tab Switcher

```jsx
<div className='flex gap-2 p-1 bg-white/5 rounded-lg'>
	<button
		className={`flex-1 py-2.5 rounded-lg
    font-medium transition-all ${
			active
				? 'bg-white text-slate-900 shadow-lg'
				: 'text-slate-300 hover:text-white'
		}`}
	>
		Tab Label
	</button>
</div>
```

### Mileage Card (Daily Breakdown)

```jsx
<div
	className='bg-white/5 backdrop-blur-sm
  border border-white/10 rounded-lg p-4 space-y-3'
>
	{/* Mileage Input Section */}
	<div className='grid grid-cols-2 gap-3'>
		<div>
			<label className='text-xs text-slate-400 block mb-1'>
				Amazon Paid Miles
			</label>
			<input
				type='number'
				step='0.01'
				className='w-full bg-white/5 border border-white/10
          rounded-lg px-3 py-2 text-white font-mono
          focus:ring-2 focus:ring-blue-500'
				placeholder='85.50'
			/>
		</div>
		<div>
			<label className='text-xs text-slate-400 block mb-1'>
				Van Logged Miles
			</label>
			<input
				type='number'
				step='0.01'
				className='w-full bg-white/5 border border-white/10
          rounded-lg px-3 py-2 text-white font-mono
          focus:ring-2 focus:ring-blue-500'
				placeholder='98.20'
			/>
		</div>
	</div>

	{/* Mileage Breakdown */}
	<div className='space-y-2 pt-2 border-t border-white/10'>
		<div className='flex justify-between items-center'>
			<span className='text-sm text-slate-400'>Mileage Pay</span>
			<span className='font-mono font-semibold text-emerald-400'>
				+£16.90
			</span>
		</div>
		<div className='flex justify-between items-center'>
			<span className='text-sm text-slate-400 flex items-center gap-1'>
				<AlertTriangle className='w-4 h-4 text-amber-400' />
				Fuel Loss
			</span>
			<span className='font-mono font-semibold text-amber-400'>-£2.58</span>
		</div>
	</div>
</div>
```

### Mileage Summary Widget (Weekly Dashboard)

```jsx
<div
	className='bg-white/5 backdrop-blur-sm
  border border-white/10 rounded-lg p-4'
>
	<div className='flex items-center gap-2 mb-3'>
		<div className='w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center'>
			<Navigation className='w-5 h-5 text-sky-400' />
		</div>
		<span className='text-sm font-medium text-slate-200'>
			Weekly Mileage
		</span>
	</div>

	<div className='space-y-2'>
		<div className='flex justify-between items-baseline'>
			<span className='text-xs text-slate-400'>Paid</span>
			<span className='font-mono text-white'>512 mi</span>
		</div>
		<div className='flex justify-between items-baseline'>
			<span className='text-xs text-slate-400'>Actual</span>
			<span className='font-mono text-white'>587 mi</span>
		</div>
		<div className='flex justify-between items-baseline'>
			<span className='text-xs text-slate-400'>Discrepancy</span>
			<span className='font-mono text-amber-400'>75 mi</span>
		</div>
	</div>

	<div className='mt-3 pt-3 border-t border-white/10'>
		<div className='flex justify-between items-center'>
			<span className='text-sm font-medium text-slate-200'>
				Mileage Earned
			</span>
			<span className='text-xl font-mono font-bold text-emerald-400'>
				£101.40
			</span>
		</div>
		<div className='flex justify-between items-center mt-1'>
			<span className='text-xs text-slate-400'>Fuel loss</span>
			<span className='text-sm font-mono text-amber-400'>-£14.89</span>
		</div>
	</div>
</div>
```

### Mileage Alert Badge

```jsx
{/* Show when discrepancy > 10% */}
<div className='flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg'>
	<AlertTriangle className='w-4 h-4 text-amber-400' />
	<span className='text-sm text-amber-400'>
		Van mileage is 15% higher than Amazon paid
	</span>
</div>
```

---

## Do's and Don'ts

### ✅ Do:

- Use the gradient for primary CTAs and hero elements
- Maintain glassmorphic aesthetic with backdrop-blur
- Show currency in monospace font
- Use semantic colors (green = positive, red = negative)
- Keep mobile users in mind (thumb-friendly tap targets)
- Provide hover/focus states for all interactive elements

### ❌ Don't:

- Mix light and dark mode in the same view
- Use pure white backgrounds (use white/10 with blur instead)
- Hide critical pay information behind interactions
- Use color alone to convey information (add icons/labels)
- Create tiny tap targets on mobile (<44px)
- Over-animate - subtle is better

---

## Data Integrity & Snapshot Architecture

### Historical Data Preservation

Wager uses a **snapshot architecture** to maintain historical accuracy of pay calculations. When rates change (mileage, invoicing service, daily pay rates), these changes should NOT retroactively affect past weeks' calculations.

### Snapshot Fields (Per Week)

The following fields are stored **per week** rather than globally:

1. **Mileage Rate** (`weeks.mileage_rate`)
   - Default: User's setting at time of week creation
   - Editable: Yes, via pencil icon in Week Summary
   - Use Case: Amazon adjusts mileage rates based on fuel prices
   - Format: Integer representing pence (1988 = 19.88p per mile)

2. **Invoicing Service** (`weeks.invoicing_service`)
   - Default: User's setting at time of week creation
   - Values: 'Self-Invoicing' (£0), 'Verso-Basic' (£10), 'Verso-Full' (£30)
   - Use Case: User switches service providers mid-year
   - Migration: `20251103_add_invoicing_service_to_weeks.sql`

### Non-Snapshot Fields (Global Settings)

These fields use **current user settings** and are NOT snapshot:

1. **Normal/DRS Daily Rates** (`work_days.daily_rate`)
   - Snapshot at work day creation
   - Reason: Rare changes, tied to specific work performed

2. **Van Hire Costs** (`van_hires.weekly_rate`)
   - Snapshot per van hire record
   - Reason: Each hire is a distinct contract period

### Example Scenario

**Week 40** (October 2025):
- Mileage rate: £0.1988/mile (user default)
- Invoicing: Self-Invoicing (£0)
- Work days: 5 × £160 = £800

**Week 44** (November 2025):
- User switches to Verso-Full in settings
- User edits Week 44 mileage rate to £0.2050/mile (Amazon adjustment)

**Result**:
- Week 40 calculations: Still use £0.1988/mile + Self-Invoicing (£0)
- Week 44 calculations: Use £0.2050/mile + Verso-Full (£30)
- Historical accuracy maintained ✅

### Implementation Notes

1. **Week Creation**: When first work day is added, week record is created with current user defaults
2. **Week Editing**: User can edit mileage rate via subtle pencil icon in Week Summary
3. **Calculations**: Always use week's snapshot values, never global settings
4. **Clear Week**: Deleting a week removes all snapshot data for that week

---

## Future Considerations

### Light Mode (if needed later)

- Background: `bg-slate-50`
- Cards: `bg-white border border-slate-200`
- Text: `text-slate-900` (headings), `text-slate-600` (body)
- Keep gradient for primary actions

### Brand Assets

- Logo: TrendingUp icon with blue-to-emerald gradient background
- Favicon: Simplified "W" or package icon
- App icon: Consider courier-specific imagery (van, package, route)

---

**Last Updated**: January 8, 2025
**Version**: 1.2 - Added ConfirmationDialog component documentation
**Status**: Active - Use for all Wager UI components
