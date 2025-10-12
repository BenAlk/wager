import { supabase } from './supabase'

export interface SignUpData {
	email: string
	password: string
	displayName: string
}

export interface LoginData {
	email: string
	password: string
}

/**
 * Sign up a new user
 * Creates user account and profile in users table
 */
export async function signUp({ email, password, displayName }: SignUpData) {
	// Get current week and year for start_week/start_year
	// TODO: Replace with proper week calculation function when implemented
	const now = new Date()
	const startWeek = 1 // Placeholder - will use custom week calculation
	const startYear = now.getFullYear()

	// Sign up with Supabase Auth
	// The database trigger will automatically create the user profile and settings
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: window.location.origin,
			data: {
				display_name: displayName,
				start_week: startWeek,
				start_year: startYear,
			},
		},
	})

	if (authError) {
		console.error('Supabase auth error:', authError)
		throw authError
	}
	if (!authData.user) {
		throw new Error('No user data returned')
	}

	console.log('User created successfully:', authData.user.id)
	console.log('Database trigger will create profile and settings automatically')

	return authData
}

/**
 * Log in an existing user
 */
export async function login({ email, password }: LoginData) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	})

	if (error) throw error
	return data
}

/**
 * Log out the current user
 */
export async function logout() {
	const { error } = await supabase.auth.signOut()
	if (error) throw error
}

/**
 * Get the current user session
 */
export async function getSession() {
	const { data, error } = await supabase.auth.getSession()
	if (error) throw error
	return data.session
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
	const { data, error } = await supabase.auth.getUser()
	if (error) throw error
	return data.user
}
