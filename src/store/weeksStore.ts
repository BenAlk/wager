import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Week, WorkDay } from '@/types/database'
import type { WeekInfo } from '@/lib/dates'

/**
 * Week cache key
 */
type WeekKey = string // Format: "2025-W42"

/**
 * Cached week data with work days
 */
interface CachedWeek {
	week: Week
	workDays: WorkDay[]
	lastFetched: number // Timestamp
}

/**
 * Weeks Store State
 */
interface WeeksState {
	// Week data cache (key: "year-Wweek")
	cache: Map<WeekKey, CachedWeek>

	// Loading states (key: "year-Wweek")
	loadingWeeks: Set<WeekKey>

	// Actions
	setWeek: (week: Week, workDays: WorkDay[]) => void
	updateWeek: (weekId: string, updates: Partial<Week>) => void
	addWorkDay: (weekKey: WeekKey, workDay: WorkDay) => void
	updateWorkDay: (weekKey: WeekKey, workDayId: string, updates: Partial<WorkDay>) => void
	removeWorkDay: (weekKey: WeekKey, workDayId: string) => void
	deleteWeek: (weekKey: WeekKey) => void
	getWeek: (weekIdentifier: WeekInfo) => CachedWeek | undefined
	setLoading: (weekKey: WeekKey, isLoading: boolean) => void
	invalidateWeek: (weekKey: WeekKey) => void
	clearCache: () => void
}

/**
 * Generate cache key from week identifier
 */
export function getWeekKey(week: number, year: number): WeekKey {
	return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Weeks Store
 *
 * Caches week and work day data to minimize Supabase queries.
 * Implements optimistic updates for better UX.
 */
export const useWeeksStore = create<WeeksState>()(
	devtools(
		(set, get) => ({
			// Initial state
			cache: new Map(),
			loadingWeeks: new Set(),

			// Set/update week in cache
			setWeek: (week, workDays) => {
				const key = getWeekKey(week.week_number, week.year)
				set(
					(state) => {
						const newCache = new Map(state.cache)
						newCache.set(key, {
							week,
							workDays,
							lastFetched: Date.now(),
						})
						return { cache: newCache }
					},
					false,
					'weeks/setWeek'
				)
			},

			// Update week metadata (optimistic)
			updateWeek: (weekId, updates) => {
				set(
					(state) => {
						const newCache = new Map(state.cache)
						for (const [key, cached] of newCache.entries()) {
							if (cached.week.id === weekId) {
								newCache.set(key, {
									...cached,
									week: { ...cached.week, ...updates },
								})
								break
							}
						}
						return { cache: newCache }
					},
					false,
					'weeks/updateWeek'
				)
			},

			// Add work day to week (optimistic)
			addWorkDay: (weekKey, workDay) => {
				set(
					(state) => {
						const cached = state.cache.get(weekKey)
						if (!cached) return state

						const newCache = new Map(state.cache)
						newCache.set(weekKey, {
							...cached,
							workDays: [...cached.workDays, workDay],
						})
						return { cache: newCache }
					},
					false,
					'weeks/addWorkDay'
				)
			},

			// Update work day (optimistic)
			updateWorkDay: (weekKey, workDayId, updates) => {
				set(
					(state) => {
						const cached = state.cache.get(weekKey)
						if (!cached) return state

						const newCache = new Map(state.cache)
						newCache.set(weekKey, {
							...cached,
							workDays: cached.workDays.map((wd) =>
								wd.id === workDayId ? { ...wd, ...updates } : wd
							),
						})
						return { cache: newCache }
					},
					false,
					'weeks/updateWorkDay'
				)
			},

			// Remove work day (optimistic)
			removeWorkDay: (weekKey, workDayId) => {
				set(
					(state) => {
						const cached = state.cache.get(weekKey)
						if (!cached) return state

						const newCache = new Map(state.cache)
						newCache.set(weekKey, {
							...cached,
							workDays: cached.workDays.filter((wd) => wd.id !== workDayId),
						})
						return { cache: newCache }
					},
					false,
					'weeks/removeWorkDay'
				)
			},

			// Delete entire week and all work days
			deleteWeek: (weekKey) => {
				set(
					(state) => {
						const newCache = new Map(state.cache)
						newCache.delete(weekKey)
						return { cache: newCache }
					},
					false,
					'weeks/deleteWeek'
				)
			},

			// Get week from cache
			getWeek: (weekIdentifier) => {
				const key = getWeekKey(weekIdentifier.week, weekIdentifier.year)
				return get().cache.get(key)
			},

			// Set loading state for week
			setLoading: (weekKey, isLoading) => {
				set(
					(state) => {
						const newLoadingWeeks = new Set(state.loadingWeeks)
						if (isLoading) {
							newLoadingWeeks.add(weekKey)
						} else {
							newLoadingWeeks.delete(weekKey)
						}
						return { loadingWeeks: newLoadingWeeks }
					},
					false,
					'weeks/setLoading'
				)
			},

			// Invalidate week cache (force refetch)
			invalidateWeek: (weekKey) => {
				set(
					(state) => {
						const newCache = new Map(state.cache)
						newCache.delete(weekKey)
						return { cache: newCache }
					},
					false,
					'weeks/invalidateWeek'
				)
			},

			// Clear all cache (logout)
			clearCache: () => {
				set(
					{
						cache: new Map(),
						loadingWeeks: new Set(),
					},
					false,
					'weeks/clearCache'
				)
			},
		}),
		{ name: 'WeeksStore' }
	)
)

/**
 * Selectors for common week queries
 */
export const selectWeekWorkDays = (weekKey: WeekKey) => (state: WeeksState) =>
	state.cache.get(weekKey)?.workDays ?? []

export const selectIsWeekLoading = (weekKey: WeekKey) => (state: WeeksState) =>
	state.loadingWeeks.has(weekKey)

export const selectWeekData = (weekKey: WeekKey) => (state: WeeksState) =>
	state.cache.get(weekKey)

/**
 * Cache duration in milliseconds (5 minutes)
 */
export const CACHE_DURATION = 5 * 60 * 1000

/**
 * Check if cached week is stale
 */
export function isCacheStale(cached: CachedWeek | undefined): boolean {
	if (!cached) return true
	return Date.now() - cached.lastFetched > CACHE_DURATION
}
