/**
 * Pay Calculation Utilities
 *
 * Core business logic for calculating courier pay including:
 * - Daily rates (Normal/DRS routes)
 * - 6-day week bonuses
 * - Performance bonuses with 6-week delay
 * - Sweep adjustments
 * - Mileage calculations and discrepancies
 * - Van hire costs with pro-rata and deposits
 *
 * All currency values are stored in pence (integers) in the database.
 * These functions work with pence internally and convert to pounds for display.
 */

import type { WorkDay, Week, VanHire, PerformanceLevel } from '@/types/database'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default rates in pence (can be customized in user_settings)
 */
export const DEFAULT_NORMAL_RATE = 16000 // �160.00
export const DEFAULT_DRS_RATE = 10000 // �100.00
export const DEFAULT_VAN_RATE = 25000 // �250.00
export const DEFAULT_MILEAGE_RATE = 1988 // 19.88p per mile (stored as pence per 100 miles)

/**
 * Fixed bonus amounts
 */
export const SIX_DAY_BONUS = 3000 // �30.00 (6 days � �5)
export const MAX_DEPOSIT = 50000 // �500.00
export const DEPOSIT_RATE_FIRST_TWO_WEEKS = 2500 // �25.00/week
export const DEPOSIT_RATE_AFTER_TWO_WEEKS = 5000 // �50.00/week

/**
 * Performance bonus rates per day (in pence)
 */
export const BONUS_BOTH_FANTASTIC_PLUS = 1200 // �12/day
export const BONUS_MIXED_FANTASTIC = 800 // �8/day

/**
 * Pay timing constants
 */
export const STANDARD_PAY_DELAY = 2 // Weeks (N+2)
export const BONUS_PAY_DELAY = 6 // Weeks (N+6)
export const DEPOSIT_HOLD_WEEKS = 6 // Weeks after off-hire

/**
 * Validation limits
 */
export const MAX_DAYS_PER_WEEK = 6 // Cannot work 7 days (illegal)
export const MAX_SWEEPS_PER_DAY = 200 // Total stops given + taken

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert pence to pounds for display
 */
export function penceToPounds(pence: number): number {
	return pence / 100
}

/**
 * Convert pounds to pence for storage
 */
export function poundsToPence(pounds: number): number {
	return Math.round(pounds * 100)
}

/**
 * Format currency for display (e.g., "�1,234.56")
 */
export function formatCurrency(pence: number): string {
	const pounds = penceToPounds(pence)
	const formatted = new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency: 'GBP',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(pounds)
	return formatted
}

/**
 * Format mileage for display (e.g., "123.45 mi")
 */
export function formatMileage(miles: number): string {
	return `${miles.toFixed(2)} mi`
}

// ============================================================================
// DAILY CALCULATIONS
// ============================================================================

/**
 * Calculate pay for a single work day
 * Returns the daily rate based on route type
 */
export function calculateDailyPay(workDay: WorkDay): number {
	return workDay.daily_rate // Already stored in pence
}

/**
 * Calculate net sweeps for a single day
 * Formula: (stops_given - stops_taken) � �1
 */
export function calculateDailySweeps(workDay: WorkDay): number {
	const netStops = workDay.stops_given - workDay.stops_taken
	return netStops * 100 // Convert to pence (�1 = 100p)
}

/**
 * Calculate mileage pay for a single day
 * Formula: amazon_paid_miles � (mileage_rate / 10000)
 * Note: mileage_rate is stored as pence per 100 miles (e.g., 1988 = �0.1988/mile)
 */
export function calculateDailyMileagePay(workDay: WorkDay): number {
	const miles = workDay.amazon_paid_miles ?? 0
	const rate = workDay.mileage_rate // In pence (e.g., 1988 = 19.88p/mile)
	return Math.round((miles * rate) / 100) // Convert to pence
}

/**
 * Calculate mileage discrepancy (unpaid miles)
 * Shows where courier is losing money on fuel costs
 */
export function calculateMileageDiscrepancy(workDay: WorkDay): {
	discrepancyMiles: number
	discrepancyValue: number // In pence
} {
	const amazonMiles = workDay.amazon_paid_miles ?? 0
	const vanMiles = workDay.van_logged_miles ?? 0
	const discrepancyMiles = vanMiles - amazonMiles

	if (discrepancyMiles <= 0) {
		return { discrepancyMiles: 0, discrepancyValue: 0 }
	}

	const rate = workDay.mileage_rate
	const discrepancyValue = Math.round((discrepancyMiles * rate) / 100)

	return { discrepancyMiles, discrepancyValue }
}

/**
 * Calculate total pay for a single day
 * Includes: base pay + sweeps + mileage
 */
export function calculateDailyTotal(workDay: WorkDay): number {
	const basePay = calculateDailyPay(workDay)
	const sweeps = calculateDailySweeps(workDay)
	const mileage = calculateDailyMileagePay(workDay)

	return basePay + sweeps + mileage
}

// ============================================================================
// WEEKLY CALCULATIONS
// ============================================================================

/**
 * Calculate base pay for all work days in a week
 * Sum of all daily rates (Normal �160 or DRS �100)
 */
export function calculateWeeklyBasePay(workDays: WorkDay[]): number {
	return workDays.reduce((sum, day) => sum + day.daily_rate, 0)
}

/**
 * Calculate 6-day bonus
 * Flat �30 bonus when working exactly 6 days (any route type combination)
 * Paid with standard pay (Week N+2)
 */
export function calculateSixDayBonus(workDays: WorkDay[]): number {
	return workDays.length === 6 ? SIX_DAY_BONUS : 0
}

/**
 * Calculate weekly sweep balance
 * Sum of all daily net sweeps
 */
export function calculateWeeklySweeps(workDays: WorkDay[]): number {
	return workDays.reduce((sum, day) => sum + calculateDailySweeps(day), 0)
}

/**
 * Calculate weekly mileage pay
 * Sum of all daily mileage payments
 */
export function calculateWeeklyMileagePay(workDays: WorkDay[]): number {
	return workDays.reduce((sum, day) => sum + calculateDailyMileagePay(day), 0)
}

/**
 * Calculate weekly mileage totals and discrepancy
 */
export function calculateWeeklyMileage(workDays: WorkDay[]): {
	totalAmazonMiles: number
	totalVanMiles: number
	totalDiscrepancyMiles: number
	totalDiscrepancyValue: number // In pence
	totalMileagePay: number // In pence
} {
	let totalAmazonMiles = 0
	let totalVanMiles = 0
	let totalDiscrepancyValue = 0
	let totalMileagePay = 0

	workDays.forEach((day) => {
		totalAmazonMiles += day.amazon_paid_miles ?? 0
		totalVanMiles += day.van_logged_miles ?? 0
		totalMileagePay += calculateDailyMileagePay(day)

		const discrepancy = calculateMileageDiscrepancy(day)
		totalDiscrepancyValue += discrepancy.discrepancyValue
	})

	const totalDiscrepancyMiles = totalVanMiles - totalAmazonMiles

	return {
		totalAmazonMiles,
		totalVanMiles,
		totalDiscrepancyMiles,
		totalDiscrepancyValue,
		totalMileagePay,
	}
}

/**
 * Calculate performance bonus for a week
 * Based on individual and company performance levels
 * Formula: days_worked � daily_bonus_rate
 *
 * Bonus Tiers:
 * - Both Fantastic+: �12/day
 * - Mixed Fantastic/Fantastic+: �8/day
 * - All others: �0/day
 */
export function calculatePerformanceBonus(
	week: Week,
	workDays: WorkDay[]
): number {
	const { individual_level, company_level } = week

	// No bonus if either level is not Fantastic or better
	if (
		!individual_level ||
		!company_level ||
		!['Fantastic', 'Fantastic+'].includes(individual_level) ||
		!['Fantastic', 'Fantastic+'].includes(company_level)
	) {
		return 0
	}

	// Determine daily bonus rate
	let dailyBonus = 0
	if (individual_level === 'Fantastic+' && company_level === 'Fantastic+') {
		dailyBonus = BONUS_BOTH_FANTASTIC_PLUS // �12/day
	} else {
		dailyBonus = BONUS_MIXED_FANTASTIC // �8/day
	}

	// Calculate total bonus
	const daysWorked = workDays.length
	return daysWorked * dailyBonus
}

/**
 * Get daily bonus rate based on performance levels
 * Returns rate in pence
 */
export function getDailyBonusRate(
	individualLevel: PerformanceLevel | null,
	companyLevel: PerformanceLevel | null
): number {
	if (
		!individualLevel ||
		!companyLevel ||
		!['Fantastic', 'Fantastic+'].includes(individualLevel) ||
		!['Fantastic', 'Fantastic+'].includes(companyLevel)
	) {
		return 0
	}

	if (individualLevel === 'Fantastic+' && companyLevel === 'Fantastic+') {
		return BONUS_BOTH_FANTASTIC_PLUS // �12/day
	}

	return BONUS_MIXED_FANTASTIC // �8/day
}

// ============================================================================
// VAN HIRE CALCULATIONS
// ============================================================================

/**
 * Calculate van hire cost for a date range
 * Pro-rata calculation: (weekly_rate / 7) � days_with_van
 */
export function calculateVanProRata(
	weeklyRate: number, // In pence
	startDate: Date,
	endDate: Date
): number {
	const days = Math.ceil(
		(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
	)
	const dailyRate = weeklyRate / 7
	return Math.round(dailyRate * days)
}

/**
 * Calculate deposit payment for a given week
 * First 2 weeks: �25/week
 * After 2 weeks: �50/week until �500 total
 */
export function calculateDepositPayment(
	weeksWithVan: number,
	totalDepositPaid: number
): number {
	// Already paid full deposit
	if (totalDepositPaid >= MAX_DEPOSIT) {
		return 0
	}

	// First 2 weeks: �25/week
	if (weeksWithVan <= 2) {
		const remaining = MAX_DEPOSIT - totalDepositPaid
		return Math.min(DEPOSIT_RATE_FIRST_TWO_WEEKS, remaining)
	}

	// After 2 weeks: �50/week
	const remaining = MAX_DEPOSIT - totalDepositPaid
	return Math.min(DEPOSIT_RATE_AFTER_TWO_WEEKS, remaining)
}

/**
 * Calculate van costs for a week
 * Includes pro-rata van hire + deposit payment
 */
export function calculateWeeklyVanCost(
	vanHire: VanHire | null,
	weekStartDate: Date,
	weekEndDate: Date,
	weeksWithVan: number
): {
	vanCost: number // Pro-rata cost in pence
	depositPayment: number // Deposit payment in pence
	totalCost: number // Total deduction in pence
} {
	if (!vanHire) {
		return { vanCost: 0, depositPayment: 0, totalCost: 0 }
	}

	// Calculate pro-rata van cost
	const vanCost = calculateVanProRata(
		vanHire.weekly_rate,
		weekStartDate,
		weekEndDate
	)

	// Calculate deposit payment
	const depositPayment = calculateDepositPayment(
		weeksWithVan,
		vanHire.deposit_paid
	)

	const totalCost = vanCost + depositPayment

	return { vanCost, depositPayment, totalCost }
}

/**
 * Calculate deposit hold until date
 * 6 weeks after off-hire date
 */
export function calculateDepositHoldDate(offHireDate: Date): Date {
	const holdDate = new Date(offHireDate)
	holdDate.setDate(holdDate.getDate() + DEPOSIT_HOLD_WEEKS * 7)
	return holdDate
}

// ============================================================================
// WEEKLY PAY SUMMARY
// ============================================================================

export interface WeeklyPayBreakdown {
	// Base pay components
	basePay: number // Daily rates total (in pence)
	sixDayBonus: number // Flat �30 if 6 days worked (in pence)
	sweeps: number // Net sweep balance (in pence)
	mileage: number // Mileage payment (in pence)

	// Deductions
	vanCost: number // Pro-rata van cost (in pence)
	depositPayment: number // Deposit payment (in pence)

	// Standard pay total (received Week N+2)
	standardPay: number // Base + 6-day + sweeps + mileage - van - deposit

	// Performance bonus (received Week N+6)
	performanceBonus: number // 6-week delay (in pence)

	// Days worked
	daysWorked: number
}

/**
 * Calculate complete weekly pay breakdown
 * Standard pay = base + 6-day bonus + sweeps + mileage - van costs
 * Received in Week N+2 (2-week arrears)
 */
export function calculateWeeklyPay(
	workDays: WorkDay[],
	week: Week,
	vanHire: VanHire | null,
	weekStartDate: Date,
	weekEndDate: Date,
	weeksWithVan: number
): WeeklyPayBreakdown {
	// Calculate base components
	const basePay = calculateWeeklyBasePay(workDays)
	const sixDayBonus = calculateSixDayBonus(workDays)
	const sweeps = calculateWeeklySweeps(workDays)
	const mileage = calculateWeeklyMileagePay(workDays)

	// Calculate van costs
	const vanCosts = calculateWeeklyVanCost(
		vanHire,
		weekStartDate,
		weekEndDate,
		weeksWithVan
	)

	// Calculate standard pay (received Week N+2)
	const standardPay =
		basePay +
		sixDayBonus +
		sweeps +
		mileage -
		vanCosts.vanCost -
		vanCosts.depositPayment

	// Performance bonus (from week.bonus_amount, received Week N+6)
	const performanceBonus = week.bonus_amount ?? 0

	return {
		basePay,
		sixDayBonus,
		sweeps,
		mileage,
		vanCost: vanCosts.vanCost,
		depositPayment: vanCosts.depositPayment,
		standardPay,
		performanceBonus,
		daysWorked: workDays.length,
	}
}

// ============================================================================
// PAY TIMING CALCULATIONS
// ============================================================================

/**
 * Calculate when standard pay will be received
 * Standard pay is paid 2 weeks in arrears (Week N work paid in Week N+2)
 */
export function calculateStandardPayWeek(workWeek: number): number {
	return workWeek + STANDARD_PAY_DELAY
}

/**
 * Calculate when performance bonus will be received
 * Performance bonus paid 6 weeks after work (Week N work, bonus received in Week N+6)
 *
 * Example: Week 38 work → Week 44 bonus received
 * The Week 38 bonus arrives with Week 42 standard pay, both received in Week 44
 */
export function calculateBonusPayWeek(workWeek: number): number {
	return workWeek + BONUS_PAY_DELAY
}

/**
 * Calculate which week's bonus will be received with current standard pay
 * If receiving Week N standard pay, also receiving Week N-4 performance bonus
 *
 * Example: Week 44 payment includes:
 * - Week 42 standard pay (2-week arrears)
 * - Week 38 performance bonus (6-week delay)
 *
 * Formula: currentWeek - STANDARD_PAY_DELAY - (BONUS_PAY_DELAY - STANDARD_PAY_DELAY)
 *        = currentWeek - 2 - 4 = currentWeek - 6 + 2 = currentWeek - 4
 */
export function calculateBonusFromWeek(currentWeek: number): number {
	// The bonus from which week is being paid in currentWeek?
	// Standard pay in currentWeek is from: currentWeek - 2
	// Bonus arrives 6 weeks after work, so work was done: currentWeek - 6
	// But since both arrive together: currentWeek (payment) = work week + 6 (bonus delay)
	// So: work week = currentWeek - 6
	return currentWeek - BONUS_PAY_DELAY
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if working 6 days (eligible for 6-day bonus)
 */
export function isEligibleForSixDayBonus(daysWorked: number): boolean {
	return daysWorked === 6
}

/**
 * Check if attempting to work 7 days (illegal)
 */
export function isWorkingSevenDays(daysWorked: number): boolean {
	return daysWorked >= 7
}

/**
 * Check if sweep count exceeds daily limit
 */
export function isSweepsOverLimit(
	stopsGiven: number,
	stopsTaken: number
): boolean {
	return stopsGiven + stopsTaken > MAX_SWEEPS_PER_DAY
}

/**
 * Check if mileage discrepancy is significant (>10%)
 */
export function isMileageDiscrepancySignificant(
	amazonMiles: number,
	vanMiles: number
): boolean {
	if (amazonMiles === 0) return false
	const discrepancy = vanMiles - amazonMiles
	const percentage = (discrepancy / amazonMiles) * 100
	return percentage > 10
}

/**
 * Validate work day data
 */
export function validateWorkDay(workDay: Partial<WorkDay>): {
	valid: boolean
	errors: string[]
} {
	const errors: string[] = []

	// Check sweep limits
	const stopsGiven = workDay.stops_given ?? 0
	const stopsTaken = workDay.stops_taken ?? 0

	if (stopsGiven < 0) errors.push('Stops given cannot be negative')
	if (stopsTaken < 0) errors.push('Stops taken cannot be negative')
	if (isSweepsOverLimit(stopsGiven, stopsTaken)) {
		errors.push(
			`Total sweeps (${stopsGiven + stopsTaken}) exceeds daily limit of ${MAX_SWEEPS_PER_DAY}`
		)
	}

	// Check mileage
	if (
		workDay.amazon_paid_miles !== undefined &&
		workDay.amazon_paid_miles !== null &&
		workDay.amazon_paid_miles < 0
	) {
		errors.push('Amazon paid miles cannot be negative')
	}
	if (
		workDay.van_logged_miles !== undefined &&
		workDay.van_logged_miles !== null &&
		workDay.van_logged_miles < 0
	) {
		errors.push('Van logged miles cannot be negative')
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Validate weekly work days
 */
export function validateWeeklyWorkDays(workDays: WorkDay[]): {
	valid: boolean
	errors: string[]
	warnings: string[]
} {
	const errors: string[] = []
	const warnings: string[] = []

	// Check for 7-day work week (illegal)
	if (isWorkingSevenDays(workDays.length)) {
		errors.push(
			`Cannot work ${workDays.length} days in a week. Maximum is ${MAX_DAYS_PER_WEEK} days.`
		)
	}

	// Check each work day
	workDays.forEach((day, index) => {
		const validation = validateWorkDay(day)
		if (!validation.valid) {
			validation.errors.forEach((error) =>
				errors.push(`Day ${index + 1}: ${error}`)
			)
		}

		// Check for significant mileage discrepancy
		const amazonMiles = day.amazon_paid_miles ?? 0
		const vanMiles = day.van_logged_miles ?? 0
		if (isMileageDiscrepancySignificant(amazonMiles, vanMiles)) {
			const discrepancy = calculateMileageDiscrepancy(day)
			warnings.push(
				`Day ${index + 1}: Van mileage is ${((discrepancy.discrepancyMiles / amazonMiles) * 100).toFixed(1)}% higher than Amazon paid (losing ${formatCurrency(discrepancy.discrepancyValue)} on fuel)`
			)
		}
	})

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	}
}
