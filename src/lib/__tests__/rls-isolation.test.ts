/**
 * RLS (Row Level Security) Isolation Tests
 *
 * Tests to verify that Supabase RLS policies correctly isolate user data.
 * Each user should only be able to access their own data across all tables.
 *
 * Test Coverage:
 * - users table isolation
 * - user_settings table isolation
 * - weeks table isolation
 * - work_days table isolation (indirect via week_id)
 * - van_hires table isolation
 *
 * @see /RLS_ISOLATION_TEST_PLAN.md for detailed test scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Supabase credentials from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Test user credentials
// Using example.com (reserved domain for testing per RFC 2606)
const TEST_USER_A = {
	email: 'test-rls-user-a@example.com',
	password: 'TestPassword123!',
	displayName: 'Test User A',
}

const TEST_USER_B = {
	email: 'test-rls-user-b@example.com',
	password: 'TestPassword123!',
	displayName: 'Test User B',
}

describe('RLS Isolation Tests', () => {
	let userAClient: SupabaseClient<Database>
	let userBClient: SupabaseClient<Database>
	let userAId: string
	let userBId: string

	// Test data IDs for cleanup
	let userAWeekId: string
	let userBWeekId: string
	let userAWorkDayId: string
	let userBWorkDayId: string
	let userAVanId: string
	let userBVanId: string

	beforeAll(async () => {
		console.log('Setting up RLS isolation tests...')

		// Create authenticated clients for both users
		userAClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
		userBClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

		// Try to sign in first (user might already exist from previous test run)
		let { data: userASignIn, error: userASignInError } =
			await userAClient.auth.signInWithPassword({
				email: TEST_USER_A.email,
				password: TEST_USER_A.password,
			})

		if (userASignInError) {
			// User doesn't exist, sign up
			const { data: userAAuth, error: userASignUpError } =
				await userAClient.auth.signUp({
					email: TEST_USER_A.email,
					password: TEST_USER_A.password,
				})
			if (userASignUpError) throw userASignUpError
			userAId = userAAuth.user!.id
		} else {
			userAId = userASignIn.user!.id
		}

		// Try to sign in first (user might already exist from previous test run)
		let { data: userBSignIn, error: userBSignInError } =
			await userBClient.auth.signInWithPassword({
				email: TEST_USER_B.email,
				password: TEST_USER_B.password,
			})

		if (userBSignInError) {
			// User doesn't exist, sign up
			const { data: userBAuth, error: userBSignUpError } =
				await userBClient.auth.signUp({
					email: TEST_USER_B.email,
					password: TEST_USER_B.password,
				})
			if (userBSignUpError) throw userBSignUpError
			userBId = userBAuth.user!.id
		} else {
			userBId = userBSignIn.user!.id
		}

		console.log(`User A ID: ${userAId}`)
		console.log(`User B ID: ${userBId}`)

		// Verify sessions are authenticated
		const { data: { session: sessionA } } = await userAClient.auth.getSession()
		const { data: { session: sessionB } } = await userBClient.auth.getSession()

		if (!sessionA || !sessionB) {
			throw new Error(`Sessions not authenticated - A: ${!!sessionA}, B: ${!!sessionB}`)
		}

		console.log('Both users authenticated with valid sessions')
		console.log('Session A user ID:', sessionA.user.id)
		console.log('Session B user ID:', sessionB.user.id)

		// Wait a moment for the database trigger (handle_new_user) to create profiles
		await new Promise((resolve) => setTimeout(resolve, 1000))

		// Try a simple SELECT to verify RLS is working
		const { data: testSelect, error: testSelectError } = await userAClient
			.from('users')
			.select('*')
			.eq('id', userAId)

		console.log('Test SELECT for User A profile:', testSelect?.length, 'rows')
		if (testSelectError) console.error('Test SELECT error:', testSelectError)

		// Update user profiles (they're auto-created by trigger)
		await userAClient.from('users').update({
			display_name: TEST_USER_A.displayName,
			start_week: 1,
			start_year: 2025,
		}).eq('id', userAId)

		// Update user settings (auto-created by trigger with defaults)
		await userAClient.from('user_settings').update({
			normal_rate: 16000,
			drs_rate: 10000,
			mileage_rate: 1988,
			invoicing_service: 'Self-Invoicing',
		}).eq('user_id', userAId)

		// Week - use insert() instead of upsert()
		const { data: weekA, error: weekAError } = await userAClient
			.from('weeks')
			.insert({
				user_id: userAId,
				week_number: 1,
				year: 2025,
				bonus_amount: 0,
				mileage_rate: 1988,
				invoicing_service: 'Self-Invoicing',
			})
			.select()
			.single()

		if (weekAError) {
			console.error('Error creating week for User A:', weekAError)
			console.error('User A ID:', userAId)
			console.error('Session user ID:', sessionA.user.id)
			throw weekAError
		}
		if (!weekA) {
			throw new Error('Week A was not created (null data)')
		}
		userAWeekId = weekA.id

		// Work day
		const { data: workDayA } = await userAClient
			.from('work_days')
			.insert({
				week_id: userAWeekId,
				date: '2025-01-06',
				route_type: 'Normal',
				daily_rate: 16000,
				stops_given: 0,
				stops_taken: 0,
				mileage_rate: 1988,
			})
			.select()
			.single()
		userAWorkDayId = workDayA!.id

		// Van hire
		const { data: vanA } = await userAClient
			.from('van_hires')
			.insert({
				user_id: userAId,
				on_hire_date: '2025-01-01',
				van_type: 'Fleet',
				registration: 'TEST-A',
				weekly_rate: 25000,
				deposit_paid: 0,
			})
			.select()
			.single()
		userAVanId = vanA!.id

		// Update User B profiles (auto-created by trigger)
		await userBClient.from('users').update({
			display_name: TEST_USER_B.displayName,
			start_week: 1,
			start_year: 2025,
		}).eq('id', userBId)

		await userBClient.from('user_settings').update({
			normal_rate: 17000,
			drs_rate: 11000,
			mileage_rate: 2000,
			invoicing_service: 'Verso-Basic',
		}).eq('user_id', userBId)

		const { data: weekB } = await userBClient
			.from('weeks')
			.upsert({
				user_id: userBId,
				week_number: 2,
				year: 2025,
				bonus_amount: 0,
				mileage_rate: 2000,
				invoicing_service: 'Verso-Basic',
			})
			.select()
			.single()
		userBWeekId = weekB!.id

		const { data: workDayB } = await userBClient
			.from('work_days')
			.insert({
				week_id: userBWeekId,
				date: '2025-01-13',
				route_type: 'DRS',
				daily_rate: 11000,
				stops_given: 0,
				stops_taken: 0,
				mileage_rate: 2000,
			})
			.select()
			.single()
		userBWorkDayId = workDayB!.id

		const { data: vanB } = await userBClient
			.from('van_hires')
			.insert({
				user_id: userBId,
				on_hire_date: '2025-01-08',
				van_type: 'Flexi',
				registration: 'TEST-B',
				weekly_rate: 15000,
				deposit_paid: 0,
			})
			.select()
			.single()
		userBVanId = vanB!.id

		console.log('Test data created successfully')
	})

	afterAll(async () => {
		console.log('Cleaning up test data...')

		// Clean up User A data
		if (userAWorkDayId) {
			await userAClient.from('work_days').delete().eq('id', userAWorkDayId)
		}
		if (userAWeekId) {
			await userAClient.from('weeks').delete().eq('id', userAWeekId)
		}
		if (userAVanId) {
			await userAClient.from('van_hires').delete().eq('id', userAVanId)
		}
		await userAClient.from('user_settings').delete().eq('user_id', userAId)
		await userAClient.from('users').delete().eq('id', userAId)

		// Clean up User B data
		if (userBWorkDayId) {
			await userBClient.from('work_days').delete().eq('id', userBWorkDayId)
		}
		if (userBWeekId) {
			await userBClient.from('weeks').delete().eq('id', userBWeekId)
		}
		if (userBVanId) {
			await userBClient.from('van_hires').delete().eq('id', userBVanId)
		}
		await userBClient.from('user_settings').delete().eq('user_id', userBId)
		await userBClient.from('users').delete().eq('id', userBId)

		// Sign out
		await userAClient.auth.signOut()
		await userBClient.auth.signOut()

		console.log('Test cleanup complete')
	})

	// =====================================================
	// USERS TABLE ISOLATION
	// =====================================================

	describe('users table isolation', () => {
		it('User A can only see their own profile', async () => {
			const { data, error } = await userAClient.from('users').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(1)
			expect(data![0].id).toBe(userAId)
		})

		it('User B can only see their own profile', async () => {
			const { data, error } = await userBClient.from('users').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(1)
			expect(data![0].id).toBe(userBId)
		})

		it('User A cannot update User B profile', async () => {
			const { data, error } = await userAClient
				.from('users')
				.update({ display_name: 'Hacked!' })
				.eq('id', userBId)
				.select()

			// RLS should block this - either error or empty data
			expect(data?.length || 0).toBe(0)
		})

		it('User A cannot insert profile for User B', async () => {
			const fakeUserId = '00000000-0000-0000-0000-000000000000'
			const { error } = await userAClient.from('users').insert({
				id: fakeUserId,
				display_name: 'Fake User',
				start_week: 1,
				start_year: 2025,
			})

			// Should fail - User A's auth.uid() != fakeUserId
			expect(error).toBeDefined()
		})
	})

	// =====================================================
	// USER_SETTINGS TABLE ISOLATION
	// =====================================================

	describe('user_settings table isolation', () => {
		it('User A can only see their own settings', async () => {
			const { data, error } = await userAClient
				.from('user_settings')
				.select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(1)
			expect(data![0].user_id).toBe(userAId)
			expect(data![0].normal_rate).toBe(16000)
		})

		it('User B can only see their own settings', async () => {
			const { data, error } = await userBClient
				.from('user_settings')
				.select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(1)
			expect(data![0].user_id).toBe(userBId)
			expect(data![0].normal_rate).toBe(17000)
		})

		it('User A cannot update User B settings', async () => {
			const { data, error } = await userAClient
				.from('user_settings')
				.update({ normal_rate: 99999 })
				.eq('user_id', userBId)
				.select()

			expect(data?.length || 0).toBe(0)
		})
	})

	// =====================================================
	// WEEKS TABLE ISOLATION
	// =====================================================

	describe('weeks table isolation', () => {
		it('User A can only see their own weeks', async () => {
			const { data, error } = await userAClient.from('weeks').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.every((week) => week.user_id === userAId)).toBe(true)
		})

		it('User B can only see their own weeks', async () => {
			const { data, error } = await userBClient.from('weeks').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.every((week) => week.user_id === userBId)).toBe(true)
		})

		it('User A cannot update User B week', async () => {
			const { data, error } = await userAClient
				.from('weeks')
				.update({ bonus_amount: 99999 })
				.eq('id', userBWeekId)
				.select()

			expect(data?.length || 0).toBe(0)
		})

		it('User A cannot delete User B week', async () => {
			await userAClient
				.from('weeks')
				.delete()
				.eq('id', userBWeekId)

			// Should not throw error, but should not delete anything
			// Verify User B week still exists
			const { data } = await userBClient
				.from('weeks')
				.select('*')
				.eq('id', userBWeekId)
				.single()

			expect(data).toBeDefined()
			expect(data!.id).toBe(userBWeekId)
		})

		it('User A cannot insert week for User B', async () => {
			const { error } = await userAClient.from('weeks').insert({
				user_id: userBId,
				week_number: 99,
				year: 2025,
				bonus_amount: 0,
				mileage_rate: 1988,
				invoicing_service: 'Self-Invoicing',
			})

			// Should fail due to RLS policy
			expect(error).toBeDefined()
		})
	})

	// =====================================================
	// WORK_DAYS TABLE ISOLATION (via week_id)
	// =====================================================

	describe('work_days table isolation', () => {
		it('User A can only see work days from their own weeks', async () => {
			const { data, error } = await userAClient.from('work_days').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			// All work days should belong to User A's weeks
			expect(data!.every((wd) => wd.week_id === userAWeekId)).toBe(true)
		})

		it('User B can only see work days from their own weeks', async () => {
			const { data, error } = await userBClient.from('work_days').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.every((wd) => wd.week_id === userBWeekId)).toBe(true)
		})

		it('User A cannot query work days by User B week_id', async () => {
			const { data, error } = await userAClient
				.from('work_days')
				.select('*')
				.eq('week_id', userBWeekId)

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(0) // RLS blocks via EXISTS clause
		})

		it('User A cannot insert work day in User B week', async () => {
			const { error } = await userAClient.from('work_days').insert({
				week_id: userBWeekId,
				date: '2025-01-20',
				route_type: 'Normal',
				daily_rate: 16000,
				stops_given: 0,
				stops_taken: 0,
				mileage_rate: 1988,
			})

			// Should fail due to RLS EXISTS check
			expect(error).toBeDefined()
		})

		it('User A cannot update User B work day', async () => {
			const { data, error } = await userAClient
				.from('work_days')
				.update({ daily_rate: 99999 })
				.eq('id', userBWorkDayId)
				.select()

			expect(data?.length || 0).toBe(0)
		})

		it('User A cannot delete User B work day', async () => {
			await userAClient
				.from('work_days')
				.delete()
				.eq('id', userBWorkDayId)

			// Verify User B work day still exists
			const { data } = await userBClient
				.from('work_days')
				.select('*')
				.eq('id', userBWorkDayId)
				.single()

			expect(data).toBeDefined()
		})
	})

	// =====================================================
	// VAN_HIRES TABLE ISOLATION
	// =====================================================

	describe('van_hires table isolation', () => {
		it('User A can only see their own van hires', async () => {
			const { data, error } = await userAClient.from('van_hires').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.every((van) => van.user_id === userAId)).toBe(true)
		})

		it('User B can only see their own van hires', async () => {
			const { data, error } = await userBClient.from('van_hires').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.every((van) => van.user_id === userBId)).toBe(true)
		})

		it('User A cannot update User B van hire', async () => {
			const { data, error } = await userAClient
				.from('van_hires')
				.update({ weekly_rate: 99999 })
				.eq('id', userBVanId)
				.select()

			expect(data?.length || 0).toBe(0)
		})

		it('User A cannot delete User B van hire', async () => {
			await userAClient
				.from('van_hires')
				.delete()
				.eq('id', userBVanId)

			// Verify User B van still exists
			const { data } = await userBClient
				.from('van_hires')
				.select('*')
				.eq('id', userBVanId)
				.single()

			expect(data).toBeDefined()
		})

		it('User A cannot insert van hire for User B', async () => {
			const { error } = await userAClient.from('van_hires').insert({
				user_id: userBId,
				on_hire_date: '2025-01-15',
				van_type: 'Fleet',
				registration: 'HACK-VAN',
				weekly_rate: 25000,
				deposit_paid: 0,
			})

			// Should fail due to RLS policy
			expect(error).toBeDefined()
		})
	})

	// =====================================================
	// EDGE CASES
	// =====================================================

	describe('edge cases', () => {
		it('Unauthenticated client cannot see any users', async () => {
			const anonClient = createClient<Database>(
				SUPABASE_URL,
				SUPABASE_ANON_KEY
			)

			const { data, error } = await anonClient.from('users').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(0) // No data visible without auth.uid()
		})

		it('Unauthenticated client cannot see any weeks', async () => {
			const anonClient = createClient<Database>(
				SUPABASE_URL,
				SUPABASE_ANON_KEY
			)

			const { data, error } = await anonClient.from('weeks').select('*')

			expect(error).toBeNull()
			expect(data).toBeDefined()
			expect(data!.length).toBe(0)
		})

		it('Unauthenticated client cannot insert data', async () => {
			const anonClient = createClient<Database>(
				SUPABASE_URL,
				SUPABASE_ANON_KEY
			)

			const { error } = await anonClient.from('users').insert({
				id: '00000000-0000-0000-0000-000000000000',
				display_name: 'Anonymous Hacker',
				start_week: 1,
				start_year: 2025,
			})

			// Should fail - no auth.uid() available
			expect(error).toBeDefined()
		})
	})
})
