/**
 * Zustand Store Exports
 *
 * Centralized export point for all application stores.
 */

// Auth Store
export { useAuthStore, selectIsAuthenticated, selectUserId, selectUserStartWeek, selectDisplayName } from './authStore'

// Settings Store
export { useSettingsStore, selectNormalRate, selectDrsRate, selectInvoicingService, selectRates } from './settingsStore'

// Calendar Store
export { useCalendarStore, selectCurrentWeekDates, selectIsCurrentWeek } from './calendarStore'
export type { CalendarView } from './calendarStore'

// Weeks Store
export {
	useWeeksStore,
	getWeekKey,
	selectWeekWorkDays,
	selectIsWeekLoading,
	selectWeekData,
	isCacheStale,
	CACHE_DURATION,
} from './weeksStore'

// Van Store
export {
	useVanStore,
	selectHasActiveVan,
	selectDepositRemaining,
	selectIsDepositComplete,
	selectActiveVanRegistration,
	selectActiveVanWeeklyRate,
} from './vanStore'
