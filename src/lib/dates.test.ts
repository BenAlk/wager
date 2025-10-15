/**
 * Tests for date calculation utilities
 *
 * Verifying against known week dates for 2024-2030
 */

import { describe, expect, test } from 'vitest'
import {
	dateToWeekNumber,
	formatDateISO,
	getBonusPaymentWeek,
	getNextWeek,
	getPreviousWeek,
	getStandardPaymentWeek,
	getWeek1StartDate,
	getWeekDateRange,
	getWeekDates,
	getWeeksInYear,
	isDateInWeek,
} from './dates'

describe('Week 1 Start Dates', () => {
	test('2024-2025: Week 1 starts Dec 29, 2024', () => {
		const week1 = getWeek1StartDate(2025)
		expect(formatDateISO(week1)).toBe('2024-12-29')
	})

	test('2025-2026: Week 1 starts Dec 28, 2025', () => {
		const week1 = getWeek1StartDate(2026)
		expect(formatDateISO(week1)).toBe('2025-12-28')
	})

	test('2026-2027: Week 1 starts Dec 27, 2026', () => {
		const week1 = getWeek1StartDate(2027)
		expect(formatDateISO(week1)).toBe('2026-12-27')
	})

	test('2027-2028: Week 1 starts Dec 26, 2027', () => {
		const week1 = getWeek1StartDate(2028)
		expect(formatDateISO(week1)).toBe('2027-12-26')
	})

	test('2028-2029: Week 1 starts Dec 31, 2028', () => {
		const week1 = getWeek1StartDate(2029)
		expect(formatDateISO(week1)).toBe('2028-12-31')
	})

	test('2029-2030: Week 1 starts Dec 30, 2029', () => {
		const week1 = getWeek1StartDate(2030)
		expect(formatDateISO(week1)).toBe('2029-12-30')
	})
})

describe('Week 52 End Dates', () => {
	test('2024-2025: Week 52 ends Dec 27, 2025', () => {
		const { endDate } = getWeekDateRange(52, 2025)
		expect(formatDateISO(endDate)).toBe('2025-12-27')
	})

	test('2025-2026: Week 52 ends Dec 26, 2026', () => {
		const { endDate } = getWeekDateRange(52, 2026)
		expect(formatDateISO(endDate)).toBe('2026-12-26')
	})

	test('2026-2027: Week 52 ends Dec 25, 2027', () => {
		const { endDate } = getWeekDateRange(52, 2027)
		expect(formatDateISO(endDate)).toBe('2027-12-25')
	})

	test('2027-2028: Week 52 ends Dec 23, 2028', () => {
		const { endDate } = getWeekDateRange(52, 2028)
		expect(formatDateISO(endDate)).toBe('2028-12-23')
	})

	test('2028-2029: Week 52 ends Dec 29, 2029', () => {
		const { endDate } = getWeekDateRange(52, 2029)
		expect(formatDateISO(endDate)).toBe('2029-12-29')
	})

	test('2029-2030: Week 52 ends Dec 28, 2030', () => {
		const { endDate } = getWeekDateRange(52, 2030)
		expect(formatDateISO(endDate)).toBe('2030-12-28')
	})
})

describe('Week 53 Existence', () => {
	test('2024-2025: No Week 53', () => {
		expect(getWeeksInYear(2025)).toBe(52)
	})

	test('2025-2026: No Week 53', () => {
		expect(getWeeksInYear(2026)).toBe(52)
	})

	test('2026-2027: No Week 53', () => {
		expect(getWeeksInYear(2027)).toBe(52)
	})

	test('2027-2028: HAS Week 53 (Dec 24-30, 2028)', () => {
		expect(getWeeksInYear(2028)).toBe(53)

		const { startDate, endDate } = getWeekDateRange(53, 2028)
		expect(formatDateISO(startDate)).toBe('2028-12-24')
		expect(formatDateISO(endDate)).toBe('2028-12-30')
	})

	test('2028-2029: No Week 53', () => {
		expect(getWeeksInYear(2029)).toBe(52)
	})

	test('2029-2030: No Week 53', () => {
		expect(getWeeksInYear(2030)).toBe(52)
	})
})

describe('Date to Week Number Conversion', () => {
	test('Jan 1, 2025 is in Week 1 of 2025', () => {
		const weekInfo = dateToWeekNumber(new Date(2025, 0, 1)) // Jan 1, 2025
		expect(weekInfo.week).toBe(1)
		expect(weekInfo.year).toBe(2025)
	})

	test('Dec 29, 2024 is in Week 1 of 2025', () => {
		const weekInfo = dateToWeekNumber(new Date(2024, 11, 29)) // Dec 29, 2024
		expect(weekInfo.week).toBe(1)
		expect(weekInfo.year).toBe(2025)
	})

	test('Oct 10, 2025 is in Week 41 of 2025', () => {
		const weekInfo = dateToWeekNumber(new Date(2025, 9, 10)) // Oct 10, 2025 (Friday)
		expect(weekInfo.week).toBe(41)
		expect(weekInfo.year).toBe(2025)
	})

	test('Dec 25, 2028 (Week 53 exists) is in Week 53', () => {
		const weekInfo = dateToWeekNumber(new Date(2028, 11, 25)) // Dec 25, 2028
		expect(weekInfo.week).toBe(53)
		expect(weekInfo.year).toBe(2028)
	})

	test('Dec 31, 2028 (last day of Week 53) is in Week 53', () => {
		const weekInfo = dateToWeekNumber(new Date(2028, 11, 30)) // Dec 30, 2028
		expect(weekInfo.week).toBe(53)
		expect(weekInfo.year).toBe(2028)
	})
})

describe('Week Navigation', () => {
	test('Previous week from Week 2 is Week 1', () => {
		const prev = getPreviousWeek(2, 2025)
		expect(prev.week).toBe(1)
		expect(prev.year).toBe(2025)
	})

	test('Previous week from Week 1, 2025 is Week 52, 2024', () => {
		const prev = getPreviousWeek(1, 2025)
		expect(prev.week).toBe(52)
		expect(prev.year).toBe(2024)
	})

	test('Next week from Week 51 is Week 52', () => {
		const next = getNextWeek(51, 2025)
		expect(next.week).toBe(52)
		expect(next.year).toBe(2025)
	})

	test('Next week from Week 52, 2025 is Week 1, 2026', () => {
		const next = getNextWeek(52, 2025)
		expect(next.week).toBe(1)
		expect(next.year).toBe(2026)
	})

	test('Next week from Week 53, 2028 is Week 1, 2029', () => {
		const next = getNextWeek(53, 2028)
		expect(next.week).toBe(1)
		expect(next.year).toBe(2029)
	})
})

describe('Payment Week Calculations', () => {
	test('Standard pay for Week 40 is paid in Week 42', () => {
		const payment = getStandardPaymentWeek(40, 2025)
		expect(payment.week).toBe(42)
		expect(payment.year).toBe(2025)
	})

	test('Standard pay for Week 51 is paid in Week 1 of next year', () => {
		const payment = getStandardPaymentWeek(51, 2025)
		expect(payment.week).toBe(1)
		expect(payment.year).toBe(2026)
	})

	test('Performance bonus for Week 39 is paid in Week 45', () => {
		const payment = getBonusPaymentWeek(39, 2025)
		expect(payment.week).toBe(45)
		expect(payment.year).toBe(2025)
	})

	test('Performance bonus for Week 50 is paid in Week 4 of next year', () => {
		const payment = getBonusPaymentWeek(50, 2025)
		expect(payment.week).toBe(4)
		expect(payment.year).toBe(2026)
	})
})

describe('Week Dates Array', () => {
	test('Week 1, 2025 has 7 dates from Dec 29, 2024 to Jan 4, 2025', () => {
		const dates = getWeekDates(1, 2025)
		expect(dates).toHaveLength(7)
		expect(formatDateISO(dates[0])).toBe('2024-12-29') // Sunday
		expect(formatDateISO(dates[6])).toBe('2025-01-04') // Saturday
	})

	test('Week 42, 2025 has 7 dates', () => {
		const dates = getWeekDates(42, 2025)
		expect(dates).toHaveLength(7)
		// Week 42 should be around Oct 5-11 based on our calculations
		expect(dates[0].getDay()).toBe(0) // Sunday
		expect(dates[6].getDay()).toBe(6) // Saturday
	})
})

describe('Date Checking', () => {
	test('Jan 1, 2025 is in Week 1, 2025', () => {
		const date = new Date(2025, 0, 1)
		expect(isDateInWeek(date, 1, 2025)).toBe(true)
		expect(isDateInWeek(date, 2, 2025)).toBe(false)
	})

	test('Dec 29, 2024 is in Week 1, 2025 (not 2024)', () => {
		const date = new Date(2024, 11, 29)
		expect(isDateInWeek(date, 1, 2025)).toBe(true)
		expect(isDateInWeek(date, 52, 2024)).toBe(false)
	})
})

describe('Edge Cases', () => {
	test('Should throw error for invalid week number (0)', () => {
		expect(() => getWeekDateRange(0, 2025)).toThrow()
	})

	test('Should throw error for invalid week number (54)', () => {
		expect(() => getWeekDateRange(54, 2025)).toThrow()
	})

	test('Should allow Week 53 for year 2028', () => {
		expect(() => getWeekDateRange(53, 2028)).not.toThrow()
	})

	test('Should throw error for Week 53 in year without it (2025)', () => {
		expect(() => getWeekDateRange(53, 2025)).toThrow()
	})
})
