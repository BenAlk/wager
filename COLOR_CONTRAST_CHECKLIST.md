# Color Contrast Verification Checklist - Wager

**Standard**: WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text ≥24px)
**Date**: January 23, 2025

---

## Testing Methodology

### Tools Required
1. **Chrome DevTools** - Built-in contrast checker
2. **WAVE Extension** - https://wave.webaim.org/extension/
3. **WebAIM Contrast Checker** - https://webaim.org/resources/contrastchecker/

### Color Palette Reference

#### Dark Theme
- Background: `#0f172a` (slate-900)
- Via: `#1e293b` (slate-800)
- Primary text: `#ffffff` (white)
- Secondary text: `#94a3b8` (slate-400)
- Tertiary text: `#64748b` (slate-500)
- Primary blue: `#3b82f6` (blue-500)
- Primary emerald: `#10b981` (emerald-500)
- Success: `#10b981` (emerald-500)
- Warning: `#f59e0b` (amber-500)
- Error: `#ef4444` (red-500)

#### Light Theme
- Background: `#f5f5f4` (stone-100)
- Via: `#fafaf9` (stone-50)
- Primary text: `#1c1917` (stone-900)
- Secondary text: `#44403c` (stone-700)
- Tertiary text: `#57534e` (stone-600)
- (Same accent colors as dark theme)

---

## Dark Theme Contrast Tests

### Text Combinations
- [ ] **White on slate-900** (`#ffffff` on `#0f172a`)
  - Expected: ✅ 15.58:1 (AAA - excellent)
  - Location: Page headings, primary text

- [ ] **White on slate-800** (`#ffffff` on `#1e293b`)
  - Expected: ✅ 12.63:1 (AAA - excellent)
  - Location: Card backgrounds

- [ ] **slate-400 on slate-900** (`#94a3b8` on `#0f172a`)
  - Expected: ✅ 6.77:1 (AA large, AAA normal)
  - Location: Secondary text, labels

- [ ] **slate-500 on slate-900** (`#64748b` on `#0f172a`)
  - Expected: ⚠️ 4.32:1 (AA large only, fails normal)
  - Location: Placeholder text, tertiary labels
  - Action: Check if only used for large text (≥24px)

### Interactive Elements
- [ ] **blue-500 on slate-900** (`#3b82f6` on `#0f172a`)
  - Expected: ✅ 5.96:1 (AA - passes)
  - Location: Links, primary buttons (gradient)

- [ ] **emerald-400 on slate-900** (`#34d399` on `#0f172a`)
  - Expected: ✅ 7.82:1 (AAA - excellent)
  - Location: Success indicators, positive values

- [ ] **amber-400 on slate-900** (`#fbbf24` on `#0f172a`)
  - Expected: ✅ 10.35:1 (AAA - excellent)
  - Location: Warning indicators, mileage discrepancy

- [ ] **red-400 on slate-900** (`#f87171` on `#0f172a`)
  - Expected: ✅ 5.29:1 (AA - passes)
  - Location: Error indicators, negative values

### Borders & UI Components
- [ ] **white/20 borders on slate-900** (Card borders)
  - Expected: ⚠️ Check visibility in DevTools
  - Location: Card borders in dark mode
  - Minimum: 3:1 for UI components (WCAG 1.4.11)

- [ ] **white/10 borders on slate-900** (Subtle borders)
  - Expected: ⚠️ May fail 3:1 requirement
  - Location: Nested card borders, input borders
  - Action: May need to increase opacity to white/15

### Buttons & Interactive States
- [ ] **White text on blue-500 background** (Primary buttons)
  - Expected: ✅ 4.57:1 (AA - passes)
  - Location: Primary action buttons

- [ ] **White text on blue-600 background** (Hover state)
  - Expected: ✅ 6.28:1 (AA - better)
  - Location: Primary button hover

- [ ] **White text on gradient** (from-blue-500 to-emerald-500)
  - Expected: ✅ Should pass (test both ends)
  - Location: Main CTA buttons, headings

---

## Light Theme Contrast Tests

### Text Combinations
- [ ] **stone-900 on stone-100** (`#1c1917` on `#f5f5f4`)
  - Expected: ✅ 14.42:1 (AAA - excellent)
  - Location: Page headings, primary text

- [ ] **stone-700 on stone-100** (`#44403c` on `#f5f5f4`)
  - Expected: ✅ 8.59:1 (AAA - excellent)
  - Location: Secondary text, labels

- [ ] **stone-600 on stone-100** (`#57534e` on `#f5f5f4`)
  - Expected: ✅ 6.68:1 (AA - passes)
  - Location: Tertiary text, placeholders

### Interactive Elements
- [ ] **blue-500 on stone-100** (`#3b82f6` on `#f5f5f4`)
  - Expected: ✅ 5.50:1 (AA - passes)
  - Location: Links, interactive elements

- [ ] **emerald-500 on stone-100** (`#10b981` on `#f5f5f4`)
  - Expected: ⚠️ ~3.8:1 (May fail normal text)
  - Location: Success indicators
  - Action: May need darker shade for light theme

- [ ] **amber-500 on stone-100** (`#f59e0b` on `#f5f5f4`)
  - Expected: ⚠️ ~2.5:1 (Likely fails)
  - Location: Warning indicators
  - Action: May need amber-600 or amber-700 for light theme

- [ ] **red-500 on stone-100** (`#ef4444` on `#f5f5f4`)
  - Expected: ⚠️ ~3.5:1 (May fail)
  - Location: Error indicators
  - Action: May need red-600 for light theme

### Borders & UI Components
- [ ] **black/12 borders on stone-100** (Card borders)
  - Expected: ⚠️ Check 3:1 minimum
  - Location: Card borders in light mode

- [ ] **black/08 borders on stone-100** (Subtle borders)
  - Expected: ⚠️ May fail 3:1 requirement
  - Location: Nested elements

---

## Component-Specific Tests

### NumberInput Component
- [ ] Dark theme: Text color vs background
- [ ] Light theme: Text color vs background
- [ ] Disabled state: Sufficient contrast?
- [ ] Focus state: Ring color visible?

### Buttons
- [ ] Primary: Text on gradient (test both ends)
- [ ] Secondary: Text on bg-white/5 (dark) or bg-white/80 (light)
- [ ] Ghost: blue-400 text on background
- [ ] Disabled: Verify reduced contrast is intentional (exempt from WCAG)

### Form Inputs
- [ ] Placeholder text: slate-500 (dark) or stone-600 (light)
- [ ] Input text: white (dark) or stone-900 (light)
- [ ] Focus ring: blue-500 visible on both themes?
- [ ] Error state: red text readable?

### Modals
- [ ] Dark theme: White text on `rgba(15, 23, 42, 0.95)`
- [ ] Light theme: Stone-900 text on `rgba(250, 250, 249, 0.98)`
- [ ] Close button: Icon contrast

### Dashboard Tiles
- [ ] Tile titles: Contrast on glass backgrounds
- [ ] Tile values: Monospace numbers readable?
- [ ] Icons: Sufficient contrast (3:1 minimum)

### Calendar
- [ ] Day numbers: Readable on glass cards?
- [ ] Selected day: Background vs text
- [ ] Disabled days: Intentionally low contrast (OK)
- [ ] Dual mileage display: Yellow van icon visible?

### Payment Breakdown
- [ ] Currency values: Emerald/red on background
- [ ] Labels: Secondary text readable?
- [ ] Total: Large gradient text

---

## Critical Areas (Known Risks)

### ⚠️ **Likely Issues to Fix**

1. **Light Theme Warning Colors**
   - amber-500, emerald-500, red-500 may fail on stone-100
   - **Fix**: Use darker shades (amber-600, emerald-600, red-600) in light theme

2. **Subtle Borders**
   - white/10 and black/08 may fail 3:1 for UI components
   - **Fix**: Increase to white/15 and black/12 minimum

3. **Placeholder Text**
   - slate-500 in dark theme may fail for small text
   - **Fix**: Only use for large text, or increase to slate-400

4. **Glass Card Backgrounds**
   - bg-white/10 with backdrop-blur may have unpredictable contrast
   - **Fix**: Test with DevTools, may need to increase opacity

---

## Testing Process

### Step 1: Automated Scan
```bash
1. Install WAVE extension
2. Visit wager.netlify.app
3. Toggle to Dark theme
4. Run WAVE scan → note all contrast errors
5. Toggle to Light theme
6. Run WAVE scan → note all contrast errors
```

### Step 2: Manual Verification
```bash
1. Open Chrome DevTools
2. For each component:
   - Right-click text → Inspect
   - Click color swatch in Styles panel
   - Verify contrast ratio meets AA (4.5:1 or 3:1 for large)
   - Screenshot failures
```

### Step 3: Fix Issues
```bash
1. Update color variables in src/index.css
2. Add theme-specific overrides if needed
3. Re-test with WAVE
4. Verify fixes in both themes
```

---

## Expected Results

### Pass Rate Target
- **Dark Theme**: 95%+ compliance (designed for accessibility)
- **Light Theme**: 85-90% compliance (may need color adjustments)

### Known Exemptions
- Disabled buttons (intentionally low contrast)
- Decorative elements (not conveying information)
- Logos (exempt from contrast requirements)

---

## Next Steps

1. [ ] Run WAVE scan on all pages (both themes)
2. [ ] Document all failures with screenshots
3. [ ] Prioritize fixes (critical vs. nice-to-have)
4. [ ] Update color palette in src/index.css
5. [ ] Re-test and verify compliance
6. [ ] Update ACCESSIBILITY_AUDIT.md with results

---

**Note**: This checklist focuses on color contrast only. Full WCAG 2.1 AA compliance requires additional testing (keyboard navigation, screen readers, etc.)
