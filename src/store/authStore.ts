import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types/database'

/**
 * Auth Store State
 */
interface AuthState {
	// Current user session
	supabaseUser: SupabaseUser | null
	userProfile: User | null

	// Loading states
	isLoading: boolean
	isInitialized: boolean

	// Actions
	setUser: (supabaseUser: SupabaseUser | null, userProfile: User | null) => void
	updateUserProfile: (updates: Partial<User>) => void
	clearUser: () => void
	setLoading: (isLoading: boolean) => void
	setInitialized: (isInitialized: boolean) => void
}

/**
 * Auth Store
 *
 * Manages user authentication state and profile data.
 * Persists minimal auth state to localStorage.
 */
export const useAuthStore = create<AuthState>()(
	devtools(
		persist(
			(set) => ({
				// Initial state
				supabaseUser: null,
				userProfile: null,
				isLoading: true,
				isInitialized: false,

				// Set both Supabase user and profile
				setUser: (supabaseUser, userProfile) => {
					set(
						{
							supabaseUser,
							userProfile,
							isLoading: false,
							isInitialized: true,
						},
						false,
						'auth/setUser'
					)
				},

				// Update user profile (optimistic update)
				updateUserProfile: (updates) => {
					set(
						(state) => ({
							userProfile: state.userProfile
								? { ...state.userProfile, ...updates }
								: null,
						}),
						false,
						'auth/updateUserProfile'
					)
				},

				// Clear all auth state (logout)
				clearUser: () => {
					set(
						{
							supabaseUser: null,
							userProfile: null,
							isLoading: false,
							isInitialized: true,
						},
						false,
						'auth/clearUser'
					)
				},

				// Set loading state
				setLoading: (isLoading) => {
					set({ isLoading }, false, 'auth/setLoading')
				},

				// Mark auth as initialized
				setInitialized: (isInitialized) => {
					set({ isInitialized }, false, 'auth/setInitialized')
				},
			}),
			{
				name: 'wager-auth',
				// Only persist user ID for session continuity
				partialize: (state) => ({
					supabaseUser: state.supabaseUser
						? { id: state.supabaseUser.id }
						: null,
				}),
			}
		),
		{ name: 'AuthStore' }
	)
)

/**
 * Selectors for common auth queries
 */
export const selectIsAuthenticated = (state: AuthState) =>
	!!state.supabaseUser && !!state.userProfile

export const selectUserId = (state: AuthState) => state.supabaseUser?.id ?? null

export const selectUserStartWeek = (state: AuthState) => ({
	week: state.userProfile?.start_week ?? null,
	year: state.userProfile?.start_year ?? null,
})

export const selectDisplayName = (state: AuthState) =>
	state.userProfile?.display_name ?? 'there'
