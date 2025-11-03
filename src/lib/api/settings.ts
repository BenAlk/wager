/**
 * Settings API functions
 * Handles CRUD operations for user settings in Supabase
 */

import { supabase } from '@/lib/supabase'
import type { UserSettings, Inserts } from '@/types/database'

/**
 * Fetch user settings from Supabase
 * Creates default settings if they don't exist
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings> {
	const { data, error } = await supabase
		.from('user_settings')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (error) {
		// If no settings exist, create default ones
		if (error.code === 'PGRST116') {
			const defaultSettings: Inserts<'user_settings'> = {
				user_id: userId,
				normal_rate: 16000, // £160
				drs_rate: 10000, // £100
				mileage_rate: 1988, // 19.88p per mile
				invoicing_service: 'Self-Invoicing',
			}

			const { data: newSettings, error: insertError } = await supabase
				.from('user_settings')
				.insert(defaultSettings)
				.select()
				.single()

			if (insertError) throw insertError
			if (!newSettings) throw new Error('Failed to create settings')

			return newSettings
		}
		throw error
	}

	return data
}

/**
 * Update user settings in Supabase
 */
export async function updateUserSettings(
	userId: string,
	updates: Partial<Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserSettings> {
	const { data, error } = await supabase
		.from('user_settings')
		.update(updates)
		.eq('user_id', userId)
		.select()
		.single()

	if (error) throw error
	if (!data) throw new Error('Failed to update settings')

	return data
}
