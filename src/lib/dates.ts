/**
 * Date and Week Calculation Utilities
 *
 * Week System Rules:
 * - Weeks run Sunday → Saturday
 * - Week 1 starts on the last Sunday of December (typically Dec 26-29)
 * - Standard work year = 52 weeks (364 days)
 * - Week 53 exists ONLY if:
 *   1. Week 52 ends on December 24th or earlier, AND
 *   2. A full Sunday-Saturday week can fit ending on/before December 31st
 *
 * Examples:
 * - 2024-2025: Week 1 = Dec 29, 2024 | Week 52 = Dec 27, 2025 | No Week 53
 * - 2027-2028: Week 1 = Dec 26, 2027 | Week 52 = Dec 23, 2028 | Week 53 = Dec 24-30, 2028
 */

import {
	addDays,
	addWeeks,
	differenceInDays,
	format,
	isAfter,
	isBefore,
	isSameDay,
	isWithinInterval,
	parseISO,
	startOfDay,
} from 'date-fns'

export interface WeekInfo {
	week: number // 1-53
	year: number // Work year (e.g., 2025 for the 2024-2025 season)
	startDate: Date // Sunday
	endDate: Date // Saturday
}

/**
 * Find Week 1 start date for a given work year (seed function)
 * This uses a simple rule: find the last Sunday in December of the previous calendar year
 * Note: This is a starting point; actual Week 1 may shift based on Week 53 in previous year
 */
function getWeek1StartDateSeed(workYear: number): Date {
	// Start from Dec 31 of the previous calendar year and work backwards to find the last Sunday
	const dec31 = new Date(workYear - 1, 11, 31) // Month is 0-indexed (11 = December)
	const dayOfWeek = dec31.getDay() // 0 = Sunday, 6 = Saturday

	// Calculate how many days back to the last Sunday
	// If Dec 31 is Sunday (0), that's our Sunday
	// If Dec 31 is Monday (1), go back 1 day to Sunday
	// If Dec 31 is Saturday (6), go back 6 days to Sunday
	const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek

	return addDays(dec31, -daysToSubtract)
}

/**
 * Find Week 1 start date for a given work year
 * Week 1 starts on the Sunday following the end of the previous work year
 * This is typically the last Sunday of December (between Dec 24-31)
 */
export function getWeek1StartDate(workYear: number): Date {
	// For early years, we need a base case
	if (workYear <= 2024) {
		// 2024 and earlier: use the seed function
		return getWeek1StartDateSeed(workYear)
	}

	// For later years, calculate based on the previous year's end
	const previousYear = workYear - 1
	const previousWeek1Start = getWeek1StartDate(previousYear)
	const previousWeek52End = addDays(addWeeks(previousWeek1Start, 52), -1)

	// Check if previous year had Week 53
	const previousWeek52EndDay = previousWeek52End.getDate()
	const previousWeek52EndMonth = previousWeek52End.getMonth()
	const previousCalendarYear = previousWeek52End.getFullYear()

	// Week 53 exists if Week 52 ends on Dec 24 or earlier AND a full week fits before Jan 1
	let previousHadWeek53 = false

	if (previousWeek52EndMonth === 11 && previousWeek52EndDay <= 24) {
		const potentialWeek53End = addDays(previousWeek52End, 7) // Following Saturday
		const dec31 = new Date(previousCalendarYear, 11, 31)

		if (
			isBefore(potentialWeek53End, dec31) ||
			isSameDay(potentialWeek53End, dec31)
		) {
			previousHadWeek53 = true
		}
	}

	if (previousHadWeek53) {
		// Week 1 starts after Week 53 ends
		const previousWeek53End = addDays(previousWeek52End, 7)
		return addDays(previousWeek53End, 1)
	} else {
		// Week 1 starts after Week 52 ends
		return addDays(previousWeek52End, 1)
	}
}

/**
 * Get the total number of weeks in a work year (52 or 53)
 */
export function getWeeksInYear(workYear: number): 52 | 53 {
	const week1Start = getWeek1StartDate(workYear)
	const week52End = addDays(addWeeks(week1Start, 52), -1) // Week 52 ends 364 days after Week 1 starts

	// Check if Week 53 exists:
	// 1. Week 52 must end on Dec 24 or earlier
	// 2. A full Sun-Sat week must fit ending on/before Dec 31
	const week52EndDay = week52End.getDate()
	const week52EndMonth = week52End.getMonth()
	const calendarYear = week52End.getFullYear()

	// Week 52 must end in December AND on day 24 or earlier
	if (week52EndMonth === 11 && week52EndDay <= 24) {
		// Check if a full week can fit ending on/before Dec 31
		const potentialWeek53End = addDays(week52End, 7) // Following Saturday (7 days later)
		const dec31 = new Date(calendarYear, 11, 31)

		// Week 53 exists if it ends on or before Dec 31
		if (
			isBefore(potentialWeek53End, dec31) ||
			isSameDay(potentialWeek53End, dec31)
		) {
			return 53
		}
	}

	return 52
}

/**
 * Get week date range for a specific week number and work year
 */
export function getWeekDateRange(
	week: number,
	workYear: number
): { startDate: Date; endDate: Date } {
	const totalWeeks = getWeeksInYear(workYear)

	if (week < 1 || week > totalWeeks) {
		throw new Error(
			`Invalid week number ${week} for work year ${workYear}. Valid range: 1-${totalWeeks}`
		)
	}

	const week1Start = getWeek1StartDate(workYear)

	// Calculate start date: Week 1 starts at week1Start, Week 2 starts 7 days later, etc.
	const startDate = addWeeks(week1Start, week - 1)
	const endDate = addDays(startDate, 6) // Saturday (6 days after Sunday)

	return { startDate, endDate }
}

/**
 * Convert a calendar date to a week number and work year
 */
export function dateToWeekNumber(date: Date): WeekInfo {
	const normalized = startOfDay(date)

	// Determine which work year this date belongs to
	// Work years transition in late December, so we need to check both possible years
	const calendarYear = normalized.getFullYear()

	// Check current work year (e.g., if date is Jan 2025, check 2025 work year which started Dec 2024)
	const currentWorkYear = calendarYear
	const currentWeek1Start = getWeek1StartDate(currentWorkYear)

	// Check next work year (in case date is in late December and belongs to next work year)
	const nextWorkYear = calendarYear + 1
	const nextWeek1Start = getWeek1StartDate(nextWorkYear)

	// Determine which work year the date belongs to
	let workYear: number
	let week1Start: Date

	if (isBefore(normalized, currentWeek1Start)) {
		// Date is before current work year started, so it belongs to previous work year
		workYear = currentWorkYear - 1
		week1Start = getWeek1StartDate(workYear)
	} else if (
		isAfter(normalized, nextWeek1Start) ||
		isSameDay(normalized, nextWeek1Start)
	) {
		// Date is on or after next work year starts
		workYear = nextWorkYear
		week1Start = nextWeek1Start
	} else {
		// Date is within current work year
		workYear = currentWorkYear
		week1Start = currentWeek1Start
	}

	// Calculate week number
	const daysSinceWeek1 = differenceInDays(normalized, week1Start)
	const weekNumber = Math.floor(daysSinceWeek1 / 7) + 1

	// Get the actual date range for this week
	const { startDate, endDate } = getWeekDateRange(weekNumber, workYear)

	return {
		week: weekNumber,
		year: workYear,
		startDate,
		endDate,
	}
}

/**
 * Get current week info based on today's date
 */
export function getCurrentWeek(): WeekInfo {
	return dateToWeekNumber(new Date())
}

/**
 * Get the previous week (or N weeks back)
 * @param weeksBack - Number of weeks to go back (default: 1)
 */
export function getPreviousWeek(week: number, year: number, weeksBack: number = 1): WeekInfo {
	let currentWeek = week
	let currentYear = year

	// Go back N weeks
	for (let i = 0; i < weeksBack; i++) {
		if (currentWeek === 1) {
			// Go to last week of previous year
			currentYear = currentYear - 1
			currentWeek = getWeeksInYear(currentYear)
		} else {
			currentWeek = currentWeek - 1
		}
	}

	return getWeekInfo(currentWeek, currentYear)
}

/**
 * Get the next week
 */
export function getNextWeek(week: number, year: number): WeekInfo {
	const totalWeeks = getWeeksInYear(year)

	if (week === totalWeeks) {
		// Go to Week 1 of next year
		return getWeekInfo(1, year + 1)
	}

	return getWeekInfo(week + 1, year)
}

/**
 * Get complete week info for a specific week number and year
 */
export function getWeekInfo(week: number, year: number): WeekInfo {
	const { startDate, endDate } = getWeekDateRange(week, year)
	return { week, year, startDate, endDate }
}

/**
 * Format week for display (e.g., "Week 42, 2025")
 */
export function formatWeek(week: number, year: number): string {
	return `Week ${week}, ${year}`
}

/**
 * Format week range for display (e.g., "Oct 5 - Oct 11, 2025")
 */
export function formatWeekRange(week: number, year: number): string {
	const { startDate, endDate } = getWeekDateRange(week, year)

	// If both dates are in the same month
	if (startDate.getMonth() === endDate.getMonth()) {
		return `${format(startDate, 'MMM d')} - ${format(endDate, 'd, yyyy')}`
	}

	// If dates span two months
	return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
}

/**
 * Format week range for display (short version, e.g., "Oct 5-11")
 */
export function formatWeekRangeShort(week: number, year: number): string {
	const { startDate, endDate } = getWeekDateRange(week, year)

	// If both dates are in the same month
	if (startDate.getMonth() === endDate.getMonth()) {
		return `${format(startDate, 'MMM d')}-${format(endDate, 'd')}`
	}

	// If dates span two months
	return `${format(startDate, 'MMM d')}-${format(endDate, 'MMM d')}`
}

/**
 * Check if a date is within a specific week
 */
export function isDateInWeek(
	date: Date,
	week: number,
	year: number
): boolean {
	const { startDate, endDate } = getWeekDateRange(week, year)
	return isWithinInterval(startOfDay(date), {
		start: startDate,
		end: endDate,
	})
}

/**
 * Get all dates in a week as an array [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
 */
export function getWeekDates(week: number, year: number): Date[] {
	const { startDate } = getWeekDateRange(week, year)
	return Array.from({ length: 7 }, (_, i) => addDays(startDate, i))
}

/**
 * Calculate which week a bonus will be paid in (work week + 6 weeks delay)
 */
export function getBonusPaymentWeek(
	workWeek: number,
	workYear: number
): WeekInfo {
	let targetWeek = workWeek + 6
	let targetYear = workYear

	// Handle year overflow
	const weeksInYear = getWeeksInYear(workYear)

	if (targetWeek > weeksInYear) {
		// Bonus payment is in next work year
		targetWeek = targetWeek - weeksInYear
		targetYear = workYear + 1
	}

	return getWeekInfo(targetWeek, targetYear)
}

/**
 * Calculate which week standard pay will be paid in (work week + 2 weeks delay)
 */
export function getStandardPaymentWeek(
	workWeek: number,
	workYear: number
): WeekInfo {
	let targetWeek = workWeek + 2
	let targetYear = workYear

	// Handle year overflow
	const weeksInYear = getWeeksInYear(workYear)

	if (targetWeek > weeksInYear) {
		// Payment is in next work year
		targetWeek = targetWeek - weeksInYear
		targetYear = workYear + 1
	}

	return getWeekInfo(targetWeek, targetYear)
}

/**
 * Parse a date string in ISO format (YYYY-MM-DD) and return Date object
 */
export function parseDate(dateString: string): Date {
	return parseISO(dateString)
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
	return format(date, 'yyyy-MM-dd')
}

/**
 * Get day of week name (Sunday, Monday, etc.)
 */
export function getDayName(date: Date): string {
	return format(date, 'EEEE')
}

/**
 * Get short day of week name (Sun, Mon, etc.)
 */
export function getDayNameShort(date: Date): string {
	return format(date, 'EEE')
}

/**
 * Check if two dates are the same day
 */
export function isSameDate(date1: Date, date2: Date): boolean {
	return isSameDay(startOfDay(date1), startOfDay(date2))
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
	return isSameDay(startOfDay(date), startOfDay(new Date()))
}

/**
 * Get the day index (0-6, where 0 = Sunday)
 */
export function getDayIndex(date: Date): number {
	return date.getDay()
}

/**
 * Get payment week for standard pay (Week N+2)
 * Standard pay is paid 2 weeks in arrears
 */
export function getPaymentWeekForStandardPay(workWeek: number, workYear: number): { weekNumber: number; year: number; month: string } {
	const paymentWeek = workWeek + 2
	let paymentYear = workYear

	// Handle year boundary
	const weeksInYear = getWeeksInYear(workYear)
	if (paymentWeek > weeksInYear) {
		paymentYear = workYear + 1
	}

	const actualPaymentWeek = paymentWeek > weeksInYear ? paymentWeek - weeksInYear : paymentWeek
	const weekInfo = getWeekInfo(actualPaymentWeek, paymentYear)
	const month = format(weekInfo.startDate, 'MMM d')

	return {
		weekNumber: actualPaymentWeek,
		year: paymentYear,
		month
	}
}

/**
 * Get payment week for performance bonus (Week N+6)
 * Performance bonus is paid 6 weeks after work
 */
export function getPaymentWeekForBonus(workWeek: number, workYear: number): { weekNumber: number; year: number; month: string } {
	const paymentWeek = workWeek + 6
	let paymentYear = workYear

	// Handle year boundary
	const weeksInYear = getWeeksInYear(workYear)
	if (paymentWeek > weeksInYear) {
		paymentYear = workYear + 1
	}

	const actualPaymentWeek = paymentWeek > weeksInYear ? paymentWeek - weeksInYear : paymentWeek
	const weekInfo = getWeekInfo(actualPaymentWeek, paymentYear)
	const month = format(weekInfo.startDate, 'MMM d')

	return {
		weekNumber: actualPaymentWeek,
		year: paymentYear,
		month
	}
}
