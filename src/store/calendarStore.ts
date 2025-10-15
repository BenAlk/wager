import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import {
	getCurrentWeek,
	getPreviousWeek,
	getNextWeek,
	getWeekDates,
	type WeekInfo,
} from '@/lib/dates'

/**
 * Calendar view mode
 */
export type CalendarView = 'week' | 'month' | 'year'

/**
 * Calendar Store State
 */
interface CalendarState {
	// Current view state
	currentWeek: WeekInfo
	viewMode: CalendarView

	// Selected day (for day detail modal)
	selectedDate: Date | null

	// Actions
	setCurrentWeek: (week: WeekInfo) => void
	goToToday: () => void
	goToPreviousWeek: () => void
	goToNextWeek: () => void
	setViewMode: (mode: CalendarView) => void
	setSelectedDate: (date: Date | null) => void
}

/**
 * Calendar Store
 *
 * Manages calendar navigation state and view preferences.
 * Persists current week and view mode to localStorage.
 */
export const useCalendarStore = create<CalendarState>()(
	devtools(
		persist(
			(set, get) => ({
				// Initial state - current week
				currentWeek: getCurrentWeek(),
				viewMode: 'week',
				selectedDate: null,

				// Set current week explicitly
				setCurrentWeek: (week) => {
					set({ currentWeek: week }, false, 'calendar/setCurrentWeek')
				},

				// Jump to current week (today)
				goToToday: () => {
					const today = getCurrentWeek()
					set({ currentWeek: today }, false, 'calendar/goToToday')
				},

				// Navigate to previous week
				goToPreviousWeek: () => {
					const current = get().currentWeek
					const previousWeek = getPreviousWeek(current.week, current.year)

					set(
						{ currentWeek: previousWeek },
						false,
						'calendar/goToPreviousWeek'
					)
				},

				// Navigate to next week
				goToNextWeek: () => {
					const current = get().currentWeek
					const nextWeek = getNextWeek(current.week, current.year)

					set({ currentWeek: nextWeek }, false, 'calendar/goToNextWeek')
				},

				// Set view mode
				setViewMode: (mode) => {
					set({ viewMode: mode }, false, 'calendar/setViewMode')
				},

				// Set selected date (for day detail modal)
				setSelectedDate: (date) => {
					set({ selectedDate: date }, false, 'calendar/setSelectedDate')
				},
			}),
			{
				name: 'wager-calendar',
				// Persist week and view mode only
				partialize: (state) => ({
					currentWeek: state.currentWeek,
					viewMode: state.viewMode,
				}),
			}
		),
		{ name: 'CalendarStore' }
	)
)

/**
 * Selectors for common calendar queries
 */
export const selectCurrentWeekDates = (state: CalendarState) =>
	getWeekDates(state.currentWeek.week, state.currentWeek.year)

export const selectIsCurrentWeek = (state: CalendarState) => {
	const today = getCurrentWeek()
	return (
		state.currentWeek.week === today.week &&
		state.currentWeek.year === today.year
	)
}
