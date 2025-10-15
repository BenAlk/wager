import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserSettings, InvoicingService } from '@/types/database'
import {
	DEFAULT_NORMAL_RATE,
	DEFAULT_DRS_RATE,
} from '@/lib/calculations'

/**
 * Settings Store State
 */
interface SettingsState {
	// Current settings
	settings: UserSettings | null

	// Loading states
	isLoading: boolean
	isSaving: boolean

	// Actions
	setSettings: (settings: UserSettings) => void
	updateSettings: (updates: Partial<UserSettings>) => void
	setLoading: (isLoading: boolean) => void
	setSaving: (isSaving: boolean) => void
	resetSettings: () => void
}

/**
 * Settings Store
 *
 * Manages user-customizable settings including pay rates and invoicing service.
 * Does not persist to localStorage - always fetched from Supabase on app load.
 */
export const useSettingsStore = create<SettingsState>()(
	devtools(
		(set) => ({
			// Initial state
			settings: null,
			isLoading: true,
			isSaving: false,

			// Set settings (from Supabase fetch)
			setSettings: (settings) => {
				set(
					{
						settings,
						isLoading: false,
					},
					false,
					'settings/setSettings'
				)
			},

			// Update settings (optimistic update)
			updateSettings: (updates) => {
				set(
					(state) => ({
						settings: state.settings
							? { ...state.settings, ...updates }
							: null,
					}),
					false,
					'settings/updateSettings'
				)
			},

			// Set loading state
			setLoading: (isLoading) => {
				set({ isLoading }, false, 'settings/setLoading')
			},

			// Set saving state
			setSaving: (isSaving) => {
				set({ isSaving }, false, 'settings/setSaving')
			},

			// Reset settings (logout)
			resetSettings: () => {
				set(
					{
						settings: null,
						isLoading: true,
						isSaving: false,
					},
					false,
					'settings/resetSettings'
				)
			},
		}),
		{ name: 'SettingsStore' }
	)
)

/**
 * Selectors for common settings queries
 */
export const selectNormalRate = (state: SettingsState) =>
	state.settings?.normal_rate ?? DEFAULT_NORMAL_RATE

export const selectDrsRate = (state: SettingsState) =>
	state.settings?.drs_rate ?? DEFAULT_DRS_RATE

export const selectInvoicingService = (state: SettingsState): InvoicingService =>
	(state.settings?.invoicing_service as InvoicingService) ?? 'Self-Invoicing'

export const selectRates = (state: SettingsState) => ({
	normal: state.settings?.normal_rate ?? DEFAULT_NORMAL_RATE,
	drs: state.settings?.drs_rate ?? DEFAULT_DRS_RATE,
})
