/**
 * Additional TypeScript types for Wager application
 *
 * These types extend the database types with computed/derived data
 * and UI-specific state types.
 */

import type {
	User,
	UserSettings,
	Week,
	WorkDay,
	VanHire,
	PerformanceLevel,
	RouteType,
	VanType,
} from './database'

// Re-export database types for convenience
export type {
	User,
	UserSettings,
	Week,
	WorkDay,
	VanHire,
	PerformanceLevel,
	RouteType,
	VanType,
}

// ============================================================================
// COMPUTED DATA TYPES
// ============================================================================

/**
 * Work day with computed pay information
 */
export interface WorkDayWithPay extends WorkDay {
	computed: {
		basePay: number // In pence
		sweeps: number // Net sweeps in pence
		mileagePay: number // Mileage payment in pence
		mileageDiscrepancy: {
			miles: number
			value: number // In pence
		}
		totalPay: number // Daily total in pence
	}
}

/**
 * Week with computed pay breakdown
 */
export interface WeekWithPay extends Week {
	workDays: WorkDayWithPay[]
	computed: {
		daysWorked: number
		basePay: number // In pence
		sixDayBonus: number // In pence
		sweeps: number // In pence
		mileagePay: number // In pence
		vanCost: number // In pence
		depositPayment: number // In pence
		standardPay: number // In pence (received Week N+2)
		performanceBonus: number // In pence (received Week N+6)
		standardPayWeek: number // Week number when standard pay received
		bonusPayWeek: number // Week number when bonus received
	}
}

/**
 * Mileage summary for a day or week
 */
export interface MileageSummary {
	amazonPaidMiles: number
	vanLoggedMiles: number
	discrepancyMiles: number
	discrepancyValue: number // In pence
	mileagePay: number // In pence
	isSignificantDiscrepancy: boolean // >10%
}

/**
 * Van hire with computed costs
 */
export interface VanHireWithCosts extends VanHire {
	computed: {
		weeksWithVan: number
		totalDepositPaid: number // In pence
		depositRemaining: number // In pence
		depositComplete: boolean
		isActive: boolean // No off_hire_date
	}
}

/**
 * Pay summary for a specific week (what you receive)
 */
export interface PayReceived {
	weekNumber: number
	year: number
	receivedDate: Date
	standardPay: {
		fromWeek: number // Week N-2 (standard pay is from 2 weeks prior)
		amount: number // In pence
		breakdown: {
			basePay: number
			sixDayBonus: number
			sweeps: number
			mileagePay: number
			vanCost: number
			depositPayment: number
		}
	}
	performanceBonus: {
		fromWeek: number // Week N-6 (bonus is from 6 weeks prior)
		amount: number // In pence
		daysWorked: number
		dailyRate: number
		levels: {
			individual: PerformanceLevel | null
			company: PerformanceLevel | null
		}
	} | null
	totalReceived: number // In pence
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Calendar view state
 */
export interface CalendarViewState {
	currentWeek: number
	currentYear: number
	viewMode: 'week' | 'month' | 'year'
	selectedDate: Date | null
}

/**
 * Week selection info
 */
export interface WeekInfo {
	weekNumber: number
	year: number
	startDate: Date // Sunday
	endDate: Date // Saturday
	isCurrent: boolean
	isPast: boolean
	isFuture: boolean
}

/**
 * Day cell state (for calendar UI)
 */
export interface DayCellState {
	date: Date
	isCurrentWeek: boolean
	isToday: boolean
	isPast: boolean
	isFuture: boolean
	hasWork: boolean
	workDay: WorkDay | null
	routeType: RouteType | null
}

/**
 * Form state for work day entry
 */
export interface WorkDayFormData {
	date: string // ISO date string
	route_type: RouteType
	route_number: string
	daily_rate: number // In pence
	stops_given: number
	stops_taken: number
	amazon_paid_miles: number | null
	van_logged_miles: number | null
	mileage_rate: number // In pence per 100 miles
	notes: string
}

/**
 * Form state for bonus entry
 */
export interface BonusFormData {
	individual_level: PerformanceLevel
	company_level: PerformanceLevel
	notes: string
}

/**
 * Form state for van hire
 */
export interface VanHireFormData {
	on_hire_date: string // ISO date string
	off_hire_date: string | null // ISO date string
	van_type: VanType | null
	registration: string
	weekly_rate: number // In pence
	notes: string
}

/**
 * Settings form data
 */
export interface SettingsFormData {
	display_name: string
	normal_rate: number // In pounds (converted to pence for storage)
	drs_rate: number // In pounds
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean
	errors: string[]
	warnings?: string[]
}

/**
 * Field validation error
 */
export interface FieldError {
	field: string
	message: string
}

// ============================================================================
// STATISTICS & ANALYTICS TYPES
// ============================================================================

/**
 * Weekly statistics
 */
export interface WeeklyStats {
	weekNumber: number
	year: number
	daysWorked: number
	totalPay: number // In pence
	averageDailyPay: number // In pence
	totalSweeps: number // Net sweeps
	totalMileage: number // Miles
	hadSixDayBonus: boolean
	hadPerformanceBonus: boolean
}

/**
 * Monthly statistics
 */
export interface MonthlyStats {
	month: number // 1-12
	year: number
	totalWeeks: number
	totalDaysWorked: number
	totalPay: number // In pence
	averageWeeklyPay: number // In pence
	totalSweeps: number
	totalMileage: number
	sixDayBonusCount: number
	performanceBonusTotal: number // In pence
}

/**
 * Yearly statistics
 */
export interface YearlyStats {
	year: number
	totalWeeks: number
	totalDaysWorked: number
	totalPay: number // In pence
	averageWeeklyPay: number // In pence
	totalSweeps: number
	totalMileage: number
	sixDayBonusCount: number
	performanceBonusTotal: number // In pence
	vanCostsTotal: number // In pence
	depositsTotal: number // In pence
}

// ============================================================================
// PREDICTION TYPES
// ============================================================================

/**
 * Future pay prediction
 */
export interface PayPrediction {
	weekNumber: number
	year: number
	receivedDate: Date
	predictedAmount: number // In pence
	confidence: 'high' | 'medium' | 'low'
	breakdown: {
		standardPay: number
		performanceBonus: number | null
	}
	assumptions: string[] // What assumptions were made
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * User notification/reminder
 */
export interface Notification {
	id: string
	type: 'reminder' | 'warning' | 'info' | 'success'
	title: string
	message: string
	actionLabel?: string
	actionUrl?: string
	createdAt: Date
	read: boolean
	priority: 'high' | 'medium' | 'low'
}

/**
 * Reminder types
 */
export type ReminderType =
	| 'enter_rankings' // Rankings available for a week
	| 'log_sweeps' // Reminder to log daily sweeps
	| 'van_deposit_due' // Deposit payment due
	| 'deposit_refund_available' // 6-week hold period expired

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

/**
 * Date range filter
 */
export interface DateRangeFilter {
	startDate: Date
	endDate: Date
}

/**
 * Week range filter
 */
export interface WeekRangeFilter {
	startWeek: number
	endWeek: number
	year: number
}

/**
 * Sort options for work history
 */
export type SortField = 'date' | 'pay' | 'sweeps' | 'mileage' | 'route_type'
export type SortDirection = 'asc' | 'desc'

export interface SortOptions {
	field: SortField
	direction: SortDirection
}
