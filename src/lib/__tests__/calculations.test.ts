import { describe, it, expect } from 'vitest'
import {
	// Constants
	DEFAULT_NORMAL_RATE,
	DEFAULT_DRS_RATE,
	SIX_DAY_BONUS,
	DEVICE_PAYMENT,
	BONUS_BOTH_FANTASTIC_PLUS,
	BONUS_MIXED_FANTASTIC,
	DEPOSIT_RATE_FIRST_TWO_WEEKS,
	DEPOSIT_RATE_AFTER_TWO_WEEKS,
	MAX_DEPOSIT,
	INVOICING_COST_SELF,
	INVOICING_COST_VERSO_BASIC,
	INVOICING_COST_VERSO_FULL,

	// Conversion functions
	penceToPounds,
	poundsToPence,
	formatCurrency,
	formatMileage,

	// Daily calculations
	calculateDailyPay,
	calculateDailySweeps,
	calculateDailyMileagePay,
	calculateMileageDiscrepancy,
	calculateDailyTotal,

	// Weekly calculations
	calculateWeeklyBasePay,
	calculateSixDayBonus,
	calculateWeeklySweeps,
	calculateWeeklyMileagePay,
	calculateWeeklyMileage,

	// Bonus calculations
	getDailyBonusRate,
	calculatePerformanceBonus,

	// Van calculations
	calculateVanProRata,
	calculateDepositPayment,
	calculateWeeklyVanCost,

	// Invoicing
	calculateInvoicingCost,

	// Validation
	isEligibleForSixDayBonus,
	isWorkingSevenDays,
	isSweepsOverLimit,
	validateWorkDay,
	validateWeeklyWorkDays,

	// Main calculation
	calculateWeeklyPayBreakdown,
} from '../calculations'
import type { WorkDay, VanHire, Week } from '@/types/database'

// ============================================================================
// TEST DATA HELPERS
// ============================================================================

const createWorkDay = (overrides: Partial<WorkDay> = {}): WorkDay => ({
	id: 'test-work-day-1',
	week_id: 'test-week-1',
	date: '2025-01-13',
	route_type: 'Normal',
	route_number: 'R123',
	daily_rate: DEFAULT_NORMAL_RATE,
	stops_given: 0,
	stops_taken: 0,
	amazon_paid_miles: 0,
	van_logged_miles: 0,
	mileage_rate: 1988, // 19.88p/mile (default)
	notes: null,
	created_at: '2025-01-13T00:00:00Z',
	updated_at: '2025-01-13T00:00:00Z',
	...overrides,
})

const createVanHire = (overrides: Partial<VanHire> = {}): VanHire => ({
	id: 'test-van-1',
	user_id: 'test-user-1',
	on_hire_date: '2025-01-06',
	off_hire_date: null,
	van_type: 'Fleet',
	registration: 'AB12 CDE',
	weekly_rate: 25000, // £250
	deposit_paid: 0,
	deposit_complete: false,
	deposit_refunded: false,
	deposit_refund_amount: null,
	deposit_hold_until: null,
	deposit_calculation_start_date: null,
	notes: null,
	created_at: '2025-01-06T00:00:00Z',
	updated_at: '2025-01-06T00:00:00Z',
	...overrides,
})

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

describe('Conversion Functions', () => {
	describe('penceToPounds', () => {
		it('converts pence to pounds correctly', () => {
			expect(penceToPounds(16000)).toBe(160)
			expect(penceToPounds(10000)).toBe(100)
			expect(penceToPounds(3000)).toBe(30)
			expect(penceToPounds(0)).toBe(0)
			expect(penceToPounds(1)).toBe(0.01)
		})
	})

	describe('poundsToPence', () => {
		it('converts pounds to pence correctly', () => {
			expect(poundsToPence(160)).toBe(16000)
			expect(poundsToPence(100)).toBe(10000)
			expect(poundsToPence(30)).toBe(3000)
			expect(poundsToPence(0)).toBe(0)
			expect(poundsToPence(0.01)).toBe(1)
		})

		it('rounds correctly for fractional pence', () => {
			expect(poundsToPence(100.005)).toBe(10001)
			expect(poundsToPence(100.004)).toBe(10000)
		})
	})

	describe('formatCurrency', () => {
		it('formats currency correctly', () => {
			expect(formatCurrency(16000)).toBe('£160.00')
			expect(formatCurrency(10000)).toBe('£100.00')
			expect(formatCurrency(3000)).toBe('£30.00')
			expect(formatCurrency(0)).toBe('£0.00')
			expect(formatCurrency(-1000)).toBe('-£10.00')
		})
	})

	describe('formatMileage', () => {
		it('formats mileage correctly', () => {
			expect(formatMileage(100)).toBe('100.00 mi')
			expect(formatMileage(1)).toBe('1.00 mi')
			expect(formatMileage(0)).toBe('0.00 mi')
			expect(formatMileage(123.456)).toBe('123.46 mi')
		})
	})
})

// ============================================================================
// DAILY CALCULATIONS
// ============================================================================

describe('Daily Calculations', () => {
	describe('calculateDailyPay', () => {
		it('returns the daily rate plus device payment for a work day', () => {
			const normalDay = createWorkDay({ route_type: 'Normal', daily_rate: DEFAULT_NORMAL_RATE })
			expect(calculateDailyPay(normalDay)).toBe(DEFAULT_NORMAL_RATE + DEVICE_PAYMENT) // £160 + £1.80

			const drsDay = createWorkDay({ route_type: 'DRS', daily_rate: DEFAULT_DRS_RATE })
			expect(calculateDailyPay(drsDay)).toBe(DEFAULT_DRS_RATE + DEVICE_PAYMENT) // £100 + £1.80
		})
	})

	describe('calculateDailySweeps', () => {
		it('calculates sweep adjustments correctly', () => {
			const day1 = createWorkDay({ stops_given: 10, stops_taken: 5 })
			expect(calculateDailySweeps(day1)).toBe(-500) // -£5

			const day2 = createWorkDay({ stops_given: 5, stops_taken: 10 })
			expect(calculateDailySweeps(day2)).toBe(500) // +£5

			const day3 = createWorkDay({ stops_given: 10, stops_taken: 10 })
			expect(calculateDailySweeps(day3)).toBe(0) // £0
		})
	})

	describe('calculateDailyMileagePay', () => {
		it('calculates mileage pay correctly', () => {
			const day = createWorkDay({ amazon_paid_miles: 100 })
			// Default rate: 1988 pence per 100 miles = 19.88p per mile
			// 100 miles × 19.88p = £19.88 = 1988 pence
			expect(calculateDailyMileagePay(day)).toBe(1988)
		})

		it('handles zero miles', () => {
			const day = createWorkDay({ amazon_paid_miles: 0 })
			expect(calculateDailyMileagePay(day)).toBe(0)
		})

		it('handles fractional calculations correctly', () => {
			const day = createWorkDay({ amazon_paid_miles: 50 })
			expect(calculateDailyMileagePay(day)).toBe(994) // 50 × 19.88 = 994 pence
		})
	})

	describe('calculateMileageDiscrepancy', () => {
		it('calculates discrepancy when van miles > paid miles', () => {
			const day = createWorkDay({
				amazon_paid_miles: 100,
				van_logged_miles: 120,
				mileage_rate: 1988
			})
			const result = calculateMileageDiscrepancy(day)
			expect(result.discrepancyMiles).toBe(20)
			expect(result.discrepancyValue).toBe(398) // 20 × 19.88p = 398 pence
		})

		it('shows zero loss when van miles <= paid miles', () => {
			const day = createWorkDay({
				amazon_paid_miles: 120,
				van_logged_miles: 100,
				mileage_rate: 1988
			})
			const result = calculateMileageDiscrepancy(day)
			expect(result.discrepancyMiles).toBe(0)
			expect(result.discrepancyValue).toBe(0) // No money lost (function returns 0 when discrepancy <= 0)
		})

		it('handles exact match', () => {
			const day = createWorkDay({
				amazon_paid_miles: 100,
				van_logged_miles: 100,
				mileage_rate: 1988
			})
			const result = calculateMileageDiscrepancy(day)
			expect(result.discrepancyMiles).toBe(0)
			expect(result.discrepancyValue).toBe(0)
		})
	})

	describe('calculateDailyTotal', () => {
		it('calculates total correctly', () => {
			const day = createWorkDay({
				route_type: 'Normal',
				daily_rate: DEFAULT_NORMAL_RATE, // £160
				stops_given: 10,
				stops_taken: 5, // -£5 sweep (taken - given = 5 - 10 = -5)
				amazon_paid_miles: 100, // +£19.88 mileage
			})
			const total = calculateDailyTotal(day)
			// £160 + £1.80 (device) - £5 + £19.88 = £176.68 = 17668 pence
			expect(total).toBe(17668)
		})
	})
})

// ============================================================================
// WEEKLY CALCULATIONS
// ============================================================================

describe('Weekly Calculations', () => {
	describe('calculateWeeklyBasePay', () => {
		it('sums all daily rates', () => {
			const workDays = [
				createWorkDay({ daily_rate: DEFAULT_NORMAL_RATE }),
				createWorkDay({ daily_rate: DEFAULT_NORMAL_RATE }),
				createWorkDay({ daily_rate: DEFAULT_DRS_RATE }),
			]
			// £160 + £160 + £100 = £420 = 42000 pence
			expect(calculateWeeklyBasePay(workDays)).toBe(42000)
		})

		it('returns 0 for empty array', () => {
			expect(calculateWeeklyBasePay([])).toBe(0)
		})
	})

	describe('calculateSixDayBonus', () => {
		it('awards bonus for exactly 6 days', () => {
			const sixDays = Array(6).fill(null).map(() => createWorkDay())
			expect(calculateSixDayBonus(sixDays)).toBe(SIX_DAY_BONUS) // £30
		})

		it('does not award bonus for 5 days', () => {
			const fiveDays = Array(5).fill(null).map(() => createWorkDay())
			expect(calculateSixDayBonus(fiveDays)).toBe(0)
		})

		it('does not award bonus for 7 days (should never happen)', () => {
			const sevenDays = Array(7).fill(null).map(() => createWorkDay())
			expect(calculateSixDayBonus(sevenDays)).toBe(0)
		})

		it('does not award bonus for 0 days', () => {
			expect(calculateSixDayBonus([])).toBe(0)
		})
	})

	describe('calculateWeeklySweeps', () => {
		it('sums all sweep adjustments', () => {
			const workDays = [
				createWorkDay({ stops_given: 10, stops_taken: 5 }), // -£5
				createWorkDay({ stops_given: 5, stops_taken: 10 }), // +£5
				createWorkDay({ stops_given: 20, stops_taken: 0 }),  // -£20
			]
			// -£5 + £5 - £20 = -£20 = -2000 pence
			expect(calculateWeeklySweeps(workDays)).toBe(-2000)
		})
	})

	describe('calculateWeeklyMileagePay', () => {
		it('sums all mileage payments', () => {
			const workDays = [
				createWorkDay({ amazon_paid_miles: 100 }), // £19.88
				createWorkDay({ amazon_paid_miles: 50 }),  // £9.94
				createWorkDay({ amazon_paid_miles: 75 }),  // £14.91
			]
			// Total: £44.73 = 4473 pence
			expect(calculateWeeklyMileagePay(workDays)).toBe(4473)
		})
	})

	describe('calculateWeeklyMileage', () => {
		it('calculates total miles and discrepancy', () => {
			const workDays = [
				createWorkDay({ amazon_paid_miles: 100, van_logged_miles: 110, mileage_rate: 1988 }),
				createWorkDay({ amazon_paid_miles: 50, van_logged_miles: 55, mileage_rate: 1988 }),
			]
			const result = calculateWeeklyMileage(workDays)
			expect(result.totalAmazonMiles).toBe(150)
			expect(result.totalVanMiles).toBe(165)
			expect(result.totalDiscrepancyMiles).toBe(15)
			expect(result.totalDiscrepancyValue).toBe(298) // 15 × 19.88p = 298 pence
		})
	})
})

// ============================================================================
// BONUS CALCULATIONS
// ============================================================================

describe('Bonus Calculations', () => {
	describe('getDailyBonusRate', () => {
		it('returns £16/day for both Fantastic+', () => {
			expect(getDailyBonusRate('Fantastic+', 'Fantastic+')).toBe(BONUS_BOTH_FANTASTIC_PLUS)
		})

		it('returns £8/day for mixed Fantastic/Fantastic+', () => {
			expect(getDailyBonusRate('Fantastic', 'Fantastic+')).toBe(BONUS_MIXED_FANTASTIC)
			expect(getDailyBonusRate('Fantastic+', 'Fantastic')).toBe(BONUS_MIXED_FANTASTIC)
			expect(getDailyBonusRate('Fantastic', 'Fantastic')).toBe(BONUS_MIXED_FANTASTIC)
		})

		it('returns £0 for all other combinations', () => {
			expect(getDailyBonusRate('Poor', 'Poor')).toBe(0)
			expect(getDailyBonusRate('Fair', 'Fair')).toBe(0)
			expect(getDailyBonusRate('Great', 'Great')).toBe(0)
			expect(getDailyBonusRate('Great', 'Fantastic')).toBe(0)
			expect(getDailyBonusRate('Poor', 'Fantastic+')).toBe(0)
		})
	})

	describe('calculatePerformanceBonus', () => {
		it('calculates bonus correctly for both Fantastic+', () => {
			const week: Partial<Week> = {
				individual_level: 'Fantastic+',
				company_level: 'Fantastic+',
			}
			const workDays = Array(5).fill(null).map(() => createWorkDay())
			const bonus = calculatePerformanceBonus(week as Week, workDays)
			// £16/day × 5 days = £80 = 8000 pence
			expect(bonus).toBe(8000)
		})

		it('calculates bonus correctly for mixed levels', () => {
			const week: Partial<Week> = {
				individual_level: 'Fantastic',
				company_level: 'Fantastic+',
			}
			const workDays = Array(6).fill(null).map(() => createWorkDay())
			const bonus = calculatePerformanceBonus(week as Week, workDays)
			// £8/day × 6 days = £48 = 4800 pence
			expect(bonus).toBe(4800)
		})

		it('returns 0 for non-bonus levels', () => {
			const week: Partial<Week> = {
				individual_level: 'Great',
				company_level: 'Fair',
			}
			const workDays = Array(6).fill(null).map(() => createWorkDay())
			const bonus = calculatePerformanceBonus(week as Week, workDays)
			expect(bonus).toBe(0)
		})
	})
})

// ============================================================================
// VAN CALCULATIONS
// ============================================================================

describe('Van Calculations', () => {
	describe('calculateVanProRata', () => {
		it('calculates full week cost correctly', () => {
			const weeklyRate = 25000 // £250
			const startDate = new Date('2025-01-06') // Sunday
			const endDate = new Date('2025-01-12') // Saturday (6 days diff)
			const result = calculateVanProRata(weeklyRate, startDate, endDate)
			// Math.ceil(6 days) = 6, then £250 / 7 × 6 = £214.29 = 21429 pence
			expect(result).toBe(21429)
		})

		it('calculates pro-rata for partial week', () => {
			const weeklyRate = 25000 // £250
			const startDate = new Date('2025-01-08') // Tuesday
			const endDate = new Date('2025-01-12') // Saturday (4 days diff)
			const result = calculateVanProRata(weeklyRate, startDate, endDate)
			// Math.ceil(4 days) = 4, then £250 / 7 × 4 = £142.86 = 14286 pence (rounded)
			expect(result).toBe(14286)
		})

		it('calculates pro-rata for single day', () => {
			const weeklyRate = 25000 // £250
			const startDate = new Date('2025-01-06T00:00:00') // Sunday
			const endDate = new Date('2025-01-06T23:59:59') // Same day
			const result = calculateVanProRata(weeklyRate, startDate, endDate)
			// Math.ceil(~1 day) = 1, then £250 / 7 × 1 = £35.71 = 3571 pence (rounded)
			expect(result).toBe(3571)
		})
	})

	describe('calculateDepositPayment', () => {
		it('calculates £25/week for first 2 weeks', () => {
			expect(calculateDepositPayment(1, 0)).toBe(DEPOSIT_RATE_FIRST_TWO_WEEKS) // Week 1
			expect(calculateDepositPayment(2, DEPOSIT_RATE_FIRST_TWO_WEEKS)).toBe(DEPOSIT_RATE_FIRST_TWO_WEEKS) // Week 2
		})

		it('calculates £50/week after first 2 weeks', () => {
			const twoWeeksDeposit = DEPOSIT_RATE_FIRST_TWO_WEEKS * 2 // £50 total
			expect(calculateDepositPayment(3, twoWeeksDeposit)).toBe(DEPOSIT_RATE_AFTER_TWO_WEEKS)
			expect(calculateDepositPayment(4, twoWeeksDeposit + DEPOSIT_RATE_AFTER_TWO_WEEKS)).toBe(DEPOSIT_RATE_AFTER_TWO_WEEKS)
		})

		it('stops at £500 maximum', () => {
			const nearMax = MAX_DEPOSIT - 2000 // £480
			const payment = calculateDepositPayment(10, nearMax)
			expect(payment).toBe(2000) // Only £20 remaining to reach £500

			const atMax = MAX_DEPOSIT
			expect(calculateDepositPayment(11, atMax)).toBe(0) // No more payments
		})
	})

	describe('calculateWeeklyVanCost', () => {
		it('calculates first week cost with deposit', () => {
			const van = createVanHire({
				on_hire_date: '2025-01-06',
				weekly_rate: 25000,
				deposit_paid: 0
			})
			const weekStart = new Date('2025-01-06')
			const weekEnd = new Date('2025-01-12')
			const result = calculateWeeklyVanCost(van, weekStart, weekEnd, 1)
			// Van cost (6 days via Math.ceil): £214.29 = 21429 pence + £25 deposit = 23929 pence
			expect(result.totalCost).toBe(23929) // 21429 + 2500 (deposit)
			expect(result.vanCost).toBe(21429)
			expect(result.depositPayment).toBe(2500) // First week: £25
		})
	})
})

// ============================================================================
// INVOICING CALCULATIONS
// ============================================================================

describe('Invoicing Calculations', () => {
	describe('calculateInvoicingCost', () => {
		it('returns £0 for self-invoicing', () => {
			expect(calculateInvoicingCost('Self-Invoicing')).toBe(INVOICING_COST_SELF)
		})

		it('returns £10 for Verso Basic', () => {
			expect(calculateInvoicingCost('Verso-Basic')).toBe(INVOICING_COST_VERSO_BASIC)
		})

		it('returns £30 for Verso Full', () => {
			expect(calculateInvoicingCost('Verso-Full')).toBe(INVOICING_COST_VERSO_FULL)
		})
	})
})

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

describe('Validation Functions', () => {
	describe('isEligibleForSixDayBonus', () => {
		it('returns true for exactly 6 days', () => {
			expect(isEligibleForSixDayBonus(6)).toBe(true)
		})

		it('returns false for other amounts', () => {
			expect(isEligibleForSixDayBonus(0)).toBe(false)
			expect(isEligibleForSixDayBonus(5)).toBe(false)
			expect(isEligibleForSixDayBonus(7)).toBe(false)
		})
	})

	describe('isWorkingSevenDays', () => {
		it('returns true for 7 days (illegal)', () => {
			expect(isWorkingSevenDays(7)).toBe(true)
		})

		it('returns false for 6 or fewer days', () => {
			expect(isWorkingSevenDays(6)).toBe(false)
			expect(isWorkingSevenDays(5)).toBe(false)
			expect(isWorkingSevenDays(0)).toBe(false)
		})
	})

	describe('isSweepsOverLimit', () => {
		it('returns true when total exceeds 200', () => {
			expect(isSweepsOverLimit(150, 51)).toBe(true)
			expect(isSweepsOverLimit(200, 1)).toBe(true)
		})

		it('returns false when total is 200 or less', () => {
			expect(isSweepsOverLimit(100, 100)).toBe(false)
			expect(isSweepsOverLimit(150, 50)).toBe(false)
			expect(isSweepsOverLimit(0, 0)).toBe(false)
		})
	})

	describe('validateWorkDay', () => {
		it('validates correct work day', () => {
			const workDay = {
				route_type: 'Normal' as const,
				daily_rate: DEFAULT_NORMAL_RATE,
				stops_given: 10,
				stops_taken: 5,
			}
			const result = validateWorkDay(workDay)
			expect(result.valid).toBe(true)
			expect(result.errors).toHaveLength(0)
		})

		it('catches negative values', () => {
			const workDay = {
				daily_rate: -1000,
				stops_given: -5,
			}
			const result = validateWorkDay(workDay)
			expect(result.valid).toBe(false)
			expect(result.errors.length).toBeGreaterThan(0)
		})

		it('catches sweeps over limit', () => {
			const workDay = {
				stops_given: 150,
				stops_taken: 100, // Total: 250 > 200
			}
			const result = validateWorkDay(workDay)
			expect(result.valid).toBe(false)
			expect(result.errors.some(e => e.includes('Total sweeps'))).toBe(true)
		})
	})

	describe('validateWeeklyWorkDays', () => {
		it('validates 6 days correctly', () => {
			const sixDays = Array(6).fill(null).map(() => createWorkDay())
			const result = validateWeeklyWorkDays(sixDays)
			expect(result.valid).toBe(true)
		})

		it('rejects 7 days (illegal)', () => {
			const sevenDays = Array(7).fill(null).map(() => createWorkDay())
			const result = validateWeeklyWorkDays(sevenDays)
			expect(result.valid).toBe(false)
			expect(result.errors.some(e => e.includes('Cannot work 7 days'))).toBe(true)
		})
	})
})

// ============================================================================
// INTEGRATION TEST - WEEKLY PAY BREAKDOWN
// ============================================================================

describe('calculateWeeklyPayBreakdown - Integration Tests', () => {
	it('calculates complete pay breakdown for 6-day week with bonus', () => {
		const workDays = Array(6).fill(null).map((_, i) =>
			createWorkDay({
				date: `2025-01-${String(6 + i).padStart(2, '0')}`,
				route_type: 'Normal',
				daily_rate: DEFAULT_NORMAL_RATE,
				stops_given: 10,
				stops_taken: 5,
				amazon_paid_miles: 100,
				mileage_rate: 1988,
			})
		)

		const breakdown = calculateWeeklyPayBreakdown(workDays, 'Self-Invoicing', [])

		// Base pay: 6 × £160 = £960
		expect(breakdown.basePay).toBe(96000)

		// Device payment: 6 × £1.80 = £10.80
		expect(breakdown.devicePayment).toBe(1080)

		// 6-day bonus: £30
		expect(breakdown.sixDayBonus).toBe(SIX_DAY_BONUS)

		// Sweeps: 6 × (5-10) = -30 stops = -£30
		expect(breakdown.sweepAdjustment).toBe(-3000)

		// Mileage: 6 × 100 miles × £0.1988 = £119.28
		expect(breakdown.mileagePayment).toBe(11928)

		// Invoicing: £0 (self-invoicing)
		expect(breakdown.invoicingCost).toBe(0)

		// Standard pay: £960 + £10.80 + £30 - £30 + £119.28 = £1090.08
		expect(breakdown.standardPay).toBe(109008)
	})

	it('calculates mixed route types without bonus', () => {
		const workDays = [
			createWorkDay({ route_type: 'Normal', daily_rate: DEFAULT_NORMAL_RATE }),
			createWorkDay({ route_type: 'Normal', daily_rate: DEFAULT_NORMAL_RATE }),
			createWorkDay({ route_type: 'DRS', daily_rate: DEFAULT_DRS_RATE }),
			createWorkDay({ route_type: 'DRS', daily_rate: DEFAULT_DRS_RATE }),
		]

		const breakdown = calculateWeeklyPayBreakdown(workDays, 'Verso-Basic', [])

		// Base pay: (2 × £160) + (2 × £100) = £520
		expect(breakdown.basePay).toBe(52000)

		// Device payment: 4 × £1.80 = £7.20
		expect(breakdown.devicePayment).toBe(720)

		// No 6-day bonus (only 4 days)
		expect(breakdown.sixDayBonus).toBe(0)

		// Invoicing: £10 (Verso Basic)
		expect(breakdown.invoicingCost).toBe(1000)

		// Standard pay: £520 + £7.20 - £10 = £517.20
		expect(breakdown.standardPay).toBe(51720)
	})
})
