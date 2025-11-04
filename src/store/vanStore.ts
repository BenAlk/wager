import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { VanHire } from '@/types/database'

/**
 * Van Store State
 */
interface VanState {
	// Current active van hire (off_hire_date is NULL)
	activeVan: VanHire | null

	// All van hires (historical)
	allVans: VanHire[]

	// Total deposit paid across all van hires
	totalDepositPaid: number

	// Loading states
	isLoading: boolean
	isSaving: boolean

	// Actions
	setActiveVan: (van: VanHire | null) => void
	setAllVans: (vans: VanHire[]) => void
	updateVan: (vanId: string, updates: Partial<VanHire>) => void
	addVan: (van: VanHire) => void
	removeVan: (vanId: string) => void
	setLoading: (isLoading: boolean) => void
	setSaving: (isSaving: boolean) => void
	clearVans: () => void
}

/**
 * Van Store
 *
 * Manages active and historical van hire data.
 * Tracks cumulative deposit across all van hires.
 */
export const useVanStore = create<VanState>()(
	devtools(
		(set) => ({
			// Initial state
			activeVan: null,
			allVans: [],
			totalDepositPaid: 0,
			isLoading: true,
			isSaving: false,

			// Set active van (currently on-hire)
			setActiveVan: (van) => {
				set({ activeVan: van }, false, 'van/setActiveVan')
			},

			// Set all van hires
			setAllVans: (vans) => {
				// Calculate total deposit across all vans
				const totalDeposit = vans.reduce(
					(sum, van) => sum + (van.deposit_paid ?? 0),
					0
				)

				// Find active van (off_hire_date is NULL)
				const active = vans.find((v) => v.off_hire_date === null) ?? null

				set(
					{
						allVans: vans,
						activeVan: active,
						totalDepositPaid: totalDeposit,
						isLoading: false,
					},
					false,
					'van/setAllVans'
				)
			},

			// Update van (optimistic)
			updateVan: (vanId, updates) => {
				set(
					(state) => {
						const updatedVans = state.allVans.map((v) =>
							v.id === vanId ? { ...v, ...updates } : v
						)

						// Recalculate total deposit
						const totalDeposit = updatedVans.reduce(
							(sum, van) => sum + (van.deposit_paid ?? 0),
							0
						)

						// Recalculate active van (van with no off_hire_date)
						const active = updatedVans.find((v) => v.off_hire_date === null) ?? null

						return {
							allVans: updatedVans,
							activeVan: active,
							totalDepositPaid: totalDeposit,
						}
					},
					false,
					'van/updateVan'
				)
			},

			// Add new van hire (optimistic)
			addVan: (van) => {
				set(
					(state) => ({
						allVans: [...state.allVans, van],
						activeVan: van.off_hire_date === null ? van : state.activeVan,
						totalDepositPaid:
							state.totalDepositPaid + (van.deposit_paid ?? 0),
					}),
					false,
					'van/addVan'
				)
			},

			// Remove van hire (optimistic)
			removeVan: (vanId) => {
				set(
					(state) => {
						const removedVan = state.allVans.find((v) => v.id === vanId)
						const filteredVans = state.allVans.filter((v) => v.id !== vanId)

						return {
							allVans: filteredVans,
							activeVan:
								state.activeVan?.id === vanId ? null : state.activeVan,
							totalDepositPaid:
								state.totalDepositPaid - (removedVan?.deposit_paid ?? 0),
						}
					},
					false,
					'van/removeVan'
				)
			},

			// Set loading state
			setLoading: (isLoading) => {
				set({ isLoading }, false, 'van/setLoading')
			},

			// Set saving state
			setSaving: (isSaving) => {
				set({ isSaving }, false, 'van/setSaving')
			},

			// Clear all van data (logout)
			clearVans: () => {
				set(
					{
						activeVan: null,
						allVans: [],
						totalDepositPaid: 0,
						isLoading: true,
						isSaving: false,
					},
					false,
					'van/clearVans'
				)
			},
		}),
		{ name: 'VanStore' }
	)
)

/**
 * Selectors for common van queries
 */
export const selectHasActiveVan = (state: VanState) => state.activeVan !== null

export const selectDepositRemaining = (state: VanState) =>
	Math.max(0, 50000 - state.totalDepositPaid) // £500 in pence

export const selectIsDepositComplete = (state: VanState) =>
	state.totalDepositPaid >= 50000 // £500 in pence

export const selectActiveVanRegistration = (state: VanState) =>
	state.activeVan?.registration ?? null

export const selectActiveVanWeeklyRate = (state: VanState) =>
	state.activeVan?.weekly_rate ?? null
