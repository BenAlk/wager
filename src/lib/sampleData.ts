/**
 * Hardcoded sample data for onboarding tour
 *
 * This provides 6 weeks of realistic courier work data to demonstrate:
 * - 6-week performance bonus delay
 * - 6-day bonus calculations
 * - Sweeps tracking
 * - Mileage pay and discrepancies
 * - Van hire costs and deposit tracking
 * - Payment This Week breakdown (Week N-2 standard + Week N-6 bonus)
 */

import { addDays, subWeeks, format } from 'date-fns';
import type { Week, WorkDay, VanHire } from '@/types/database';
import { getCurrentWeek } from './dates';

// Generate sample data based on current week
export function generateSampleData() {
  const currentWeekInfo = getCurrentWeek();
  const currentWeek = currentWeekInfo.week;
  const currentYear = currentWeekInfo.year;

  // Calculate week numbers for the past 6 weeks
  const weeks = [];
  for (let i = 6; i >= 1; i--) {
    let weekNum = currentWeek - i;
    let year = currentYear;

    // Handle year boundary (simplified - assumes 52 weeks)
    if (weekNum <= 0) {
      weekNum += 52;
      year -= 1;
    }

    weeks.push({ weekNum, year });
  }

  // User ID for sample data (fake UUID)
  const userId = '00000000-0000-0000-0000-000000000001';

  // Generate sample weeks
  const sampleWeeks: Week[] = weeks.map(({ weekNum, year }, index) => {
    const weekAgo = 6 - index;
    const baseId = `sample-week-${weekAgo}`;

    // Determine rankings and bonus
    let individualLevel: string | null = null;
    let companyLevel: string | null = null;
    let bonusAmount = 0;

    switch (weekAgo) {
      case 6: // Week N-6: Best bonus (will show in Payment This Week)
        individualLevel = 'Fantastic+';
        companyLevel = 'Fantastic+';
        bonusAmount = 16 * 6 * 100; // £16/day × 6 days = £96 (in pence)
        break;
      case 5: // Week N-5: Medium bonus
        individualLevel = 'Fantastic';
        companyLevel = 'Fantastic+';
        bonusAmount = 8 * 5 * 100; // £8/day × 5 days = £40 (in pence)
        break;
      case 4: // Week N-4: Medium bonus + 6-day bonus
        individualLevel = 'Fantastic+';
        companyLevel = 'Fantastic';
        bonusAmount = 8 * 6 * 100; // £8/day × 6 days = £48 (in pence)
        break;
      case 3: // Week N-3: No bonus (not eligible)
        individualLevel = 'Great';
        companyLevel = 'Fantastic';
        bonusAmount = 0;
        break;
      case 2: // Week N-2: Best bonus + 6-day bonus (will show in Payment This Week)
        individualLevel = 'Fantastic+';
        companyLevel = 'Fantastic+';
        bonusAmount = 16 * 6 * 100; // £16/day × 6 days = £96 (in pence)
        break;
      case 1: // Week N-1: No rankings entered yet (too early)
        individualLevel = null;
        companyLevel = null;
        bonusAmount = 0;
        break;
    }

    return {
      id: baseId,
      user_id: userId,
      week_number: weekNum,
      year: year,
      individual_level: individualLevel,
      company_level: companyLevel,
      bonus_amount: bonusAmount,
      mileage_rate: 1988, // £0.1988/mile
      invoicing_service: 'Self-Invoicing',
      notes: null,
      rankings_entered_at: (weekAgo <= 2 && individualLevel) ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Week;
  });

  // Generate work days for each week
  const sampleWorkDays: WorkDay[] = [];

  sampleWeeks.forEach((week, weekIndex) => {
    const weekAgo = 6 - weekIndex;
    const daysInWeek = [6, 5, 6, 4, 6, 5][weekIndex]; // Days worked per week

    // Get week start date (approximation for sample data)
    const weekStartDate = subWeeks(new Date(), weekAgo);

    for (let dayIndex = 0; dayIndex < daysInWeek; dayIndex++) {
      const workDate = addDays(weekStartDate, dayIndex);
      const isNormalRoute = dayIndex < 4; // First 4 days are Normal, rest are DRS

      sampleWorkDays.push({
        id: `sample-workday-${weekAgo}-${dayIndex}`,
        week_id: week.id,
        date: format(workDate, 'yyyy-MM-dd'),
        route_type: isNormalRoute ? 'Normal' : 'DRS',
        route_number: isNormalRoute ? `DA4-${120 + dayIndex}` : `DRS-${dayIndex}`,
        daily_rate: isNormalRoute ? 16000 : 10000, // £160 or £100 in pence
        stops_given: Math.floor(Math.random() * 15) + 5, // 5-20 stops
        stops_taken: Math.floor(Math.random() * 8), // 0-8 stops
        amazon_paid_miles: Math.floor(Math.random() * 30) + 70, // 70-100 miles
        van_logged_miles: Math.floor(Math.random() * 30) + 80, // 80-110 miles (usually higher)
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as WorkDay);
    }
  });

  // Generate sample van hire (active for all 6 weeks)
  // Van started Week N-6, so deposits started being deducted from Week N-4 paycheck onwards
  const vanStartDate = subWeeks(new Date(), 6);
  const sampleVanHire: VanHire = {
    id: 'sample-van-hire-1',
    user_id: userId,
    on_hire_date: format(vanStartDate, 'yyyy-MM-dd'),
    off_hire_date: null, // Active
    van_type: 'Fleet',
    registration: 'AB12 CDE',
    weekly_rate: 25000, // £250/week in pence
    deposit_paid: 15000, // £150 paid so far (Week N-4: £25, Week N-3: £25, Week N-2: £50, Week N-1: £50)
    deposit_complete: false,
    deposit_refunded: false,
    deposit_refund_amount: null,
    deposit_hold_until: null,
    deposit_calculation_start_date: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    weeks: sampleWeeks,
    workDays: sampleWorkDays,
    vanHire: sampleVanHire,
    userId,
  };
}

// Pre-generate sample data (can be used for consistent demos)
// This is loaded into the weeks store cache in-memory during the guided tour
// It does NOT get saved to the database, so it won't interfere with real user data
export const SAMPLE_DATA = generateSampleData();
