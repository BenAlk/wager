import { supabase } from './supabase'

export interface SignUpData {
	email: string
	password: string
	displayName: string
	firstName?: string
	lastName?: string
}

export interface LoginData {
	email: string
	password: string
}

/**
 * Sign up a new user
 * Creates user account and profile in users table
 */
export async function signUp({ email, password, displayName, firstName, lastName }: SignUpData) {
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
				first_name: firstName || null,
				last_name: lastName || null,
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

	// Check if this is an existing user
	// When email confirmation is enabled:
	// - Existing users: identities array is EMPTY and no session is created
	// - New users: identities array has an entry OR a session is created
	if (
		authData.user.identities &&
		authData.user.identities.length === 0 &&
		!authData.session
	) {
		throw new Error('User already registered')
	}

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
 * Gracefully handles cases where session is already missing
 */
export async function logout() {
	const { error } = await supabase.auth.signOut()

	// Ignore "Auth session missing" errors - user is already logged out
	if (error && error.message !== 'Auth session missing!') {
		throw error
	}

	// Clear any local state
	// Note: Supabase client automatically clears localStorage on signOut
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

/**
 * Check if an email address is already registered
 * Uses auth metadata check when email confirmation is enabled
 * NOTE: This function is deprecated - duplicate detection now happens in signUp()
 */
export async function checkEmailExists(_email: string): Promise<boolean> {
	// This function is deprecated
	// Duplicate email detection now happens in signUp() by checking the identities array
	// when email confirmation is enabled in Supabase
	return false
}

/**
 * Send password reset email
 * Returns true if email was sent successfully
 */
export async function sendPasswordResetEmail(email: string): Promise<{
	success: boolean
	message: string
}> {
	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/reset-password`,
		})

		if (error) {
			// Supabase doesn't expose if email exists for security reasons
			// But we can check for common errors
			if (error.message.includes('rate limit')) {
				return {
					success: false,
					message: 'Too many requests. Please try again in a few minutes.',
				}
			}
			throw error
		}

		return {
			success: true,
			message: 'If an account exists with this email, a password reset link has been sent.',
		}
	} catch (err) {
		console.error('Error sending password reset email:', err)
		return {
			success: false,
			message: err instanceof Error ? err.message : 'Failed to send reset email',
		}
	}
}

/**
 * Update user password with reset token
 */
export async function updatePassword(newPassword: string) {
	const { error } = await supabase.auth.updateUser({
		password: newPassword,
	})

	if (error) throw error
}
