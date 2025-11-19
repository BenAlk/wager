import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { fetchUserSettings } from '@/lib/api/settings'
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'

interface AuthContextType {
	user: User | null
	session: Session | null
	loading: boolean
	refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	session: null,
	loading: true,
	refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)
	const { setSettings, setLoading: setSettingsLoading } = useSettingsStore()
	const { setUser: setAuthUser } = useAuthStore()

	// Load user profile and settings when user is authenticated
	useEffect(() => {
		const loadUserData = async (userId: string, supabaseUser: User) => {
			try {
				setSettingsLoading(true)

				// Fetch user profile
				const { data: userProfile, error: profileError } = await supabase
					.from('users')
					.select('*')
					.eq('id', userId)
					.single()

				if (profileError) {
					console.error('Error loading user profile:', profileError)
				} else {
					// Update auth store with both supabase user and profile
					setAuthUser(supabaseUser, userProfile)
				}

				// Fetch user settings
				const settings = await fetchUserSettings(userId)
				setSettings(settings)
			} catch (error) {
				console.error('Error loading user data:', error)
			} finally {
				setSettingsLoading(false)
			}
		}

		if (user?.id) {
			loadUserData(user.id, user)
		}
	}, [user?.id, setSettings, setSettingsLoading, setAuthUser])

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
			setUser(session?.user ?? null)
			setLoading(false)
		})

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
			setUser(session?.user ?? null)
			setLoading(false)
		})

		return () => subscription.unsubscribe()
	}, [])

	// Function to refresh user data (useful after profile updates)
	const refreshUser = async () => {
		if (!user?.id) return

		try {
			// Fetch updated user profile
			const { data: userProfile, error: profileError } = await supabase
				.from('users')
				.select('*')
				.eq('id', user.id)
				.single()

			if (profileError) {
				console.error('Error refreshing user profile:', profileError)
			} else {
				// Update auth store with updated profile
				setAuthUser(user, userProfile)
			}
		} catch (error) {
			console.error('Error refreshing user:', error)
		}
	}

	return (
		<AuthContext.Provider value={{ user, session, loading, refreshUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
