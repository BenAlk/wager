/**
 * Van Hire API functions
 *
 * Handles CRUD operations for van hires in Supabase
 */

import { supabase } from '@/lib/supabase'
import type { VanHire } from '@/types/database'

/**
 * Fetch all van hires for a user
 * Ordered by on_hire_date descending (most recent first)
 */
export async function fetchAllVanHires(
	userId: string
): Promise<VanHire[] | null> {
	try {
		const { data, error } = await supabase
			.from('van_hires')
			.select('*')
			.eq('user_id', userId)
			.order('on_hire_date', { ascending: false })

		if (error) throw error
		return data
	} catch (error) {
		console.error('Error fetching van hires:', error)
		return null
	}
}

/**
 * Fetch active van hire (off_hire_date is NULL)
 */
export async function fetchActiveVanHire(
	userId: string
): Promise<VanHire | null> {
	try {
		const { data, error } = await supabase
			.from('van_hires')
			.select('*')
			.eq('user_id', userId)
			.is('off_hire_date', null)
			.single()

		if (error) {
			// No active van is not an error
			if (error.code === 'PGRST116') return null
			throw error
		}
		return data
	} catch (error) {
		console.error('Error fetching active van hire:', error)
		return null
	}
}

/**
 * Fetch van hire that was active on a specific date
 */
export async function fetchVanHireForDate(
	userId: string,
	date: Date
): Promise<VanHire | null> {
	try {
		const dateStr = date.toISOString().split('T')[0]

		const { data, error } = await supabase
			.from('van_hires')
			.select('*')
			.eq('user_id', userId)
			.lte('on_hire_date', dateStr)
			.or(`off_hire_date.is.null,off_hire_date.gte.${dateStr}`)
			.single()

		if (error) {
			if (error.code === 'PGRST116') return null // No van on that date
			throw error
		}
		return data
	} catch (error) {
		console.error('Error fetching van hire for date:', error)
		return null
	}
}

/**
 * Create a new van hire
 */
export async function createVanHire(
	vanHire: Omit<VanHire, 'id' | 'created_at' | 'updated_at'>
): Promise<VanHire | null> {
	try {
		const { data, error } = await supabase
			.from('van_hires')
			.insert(vanHire)
			.select()
			.single()

		if (error) throw error
		return data
	} catch (error) {
		console.error('Error creating van hire:', error)
		return null
	}
}

/**
 * Update a van hire
 */
export async function updateVanHire(
	vanId: string,
	updates: Partial<Omit<VanHire, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<VanHire | null> {
	try {
		const { data, error } = await supabase
			.from('van_hires')
			.update(updates)
			.eq('id', vanId)
			.select()
			.single()

		if (error) throw error
		return data
	} catch (error) {
		console.error('Error updating van hire:', error)
		return null
	}
}

/**
 * Off-hire a van (set off_hire_date and calculate deposit hold)
 */
export async function offHireVan(
	vanId: string,
	offHireDate: Date
): Promise<VanHire | null> {
	try {
		// Calculate deposit hold until date (6 weeks after off-hire)
		const depositHoldUntil = new Date(offHireDate)
		depositHoldUntil.setDate(depositHoldUntil.getDate() + 6 * 7)

		const { data, error } = await supabase
			.from('van_hires')
			.update({
				off_hire_date: offHireDate.toISOString().split('T')[0],
				deposit_hold_until: depositHoldUntil.toISOString().split('T')[0],
			})
			.eq('id', vanId)
			.select()
			.single()

		if (error) throw error
		return data
	} catch (error) {
		console.error('Error off-hiring van:', error)
		return null
	}
}

/**
 * Process deposit refund
 */
export async function refundDeposit(
	vanId: string,
	refundAmount: number
): Promise<VanHire | null> {
	try {
		const { data, error } = await supabase
			.from('van_hires')
			.update({
				deposit_refunded: true,
				deposit_refund_amount: refundAmount,
			})
			.eq('id', vanId)
			.select()
			.single()

		if (error) throw error
		return data
	} catch (error) {
		console.error('Error refunding deposit:', error)
		return null
	}
}

/**
 * Delete a van hire (admin/correction only)
 */
export async function deleteVanHire(vanId: string): Promise<boolean> {
	try {
		const { error } = await supabase.from('van_hires').delete().eq('id', vanId)

		if (error) throw error
		return true
	} catch (error) {
		console.error('Error deleting van hire:', error)
		return false
	}
}

/**
 * Calculate total deposit paid across all van hires
 */
export async function calculateTotalDepositPaid(
	userId: string
): Promise<number> {
	try {
		const vans = await fetchAllVanHires(userId)
		if (!vans) return 0

		return vans.reduce((total, van) => total + (van.deposit_paid ?? 0), 0)
	} catch (error) {
		console.error('Error calculating total deposit:', error)
		return 0
	}
}

/**
 * Recalculate and update deposits for all van hires
 * This calculates deposits based on chronological order and total weeks with ANY van
 *
 * Deposit logic:
 * - First 2 weeks with ANY van: £25/week
 * - Weeks 3+ with ANY van: £50/week
 * - Max total: £500
 *
 * Each van's deposit_paid represents the cumulative deposits paid WHILE that van was active
 */
export async function recalculateAllDeposits(userId: string): Promise<boolean> {
	try {
		const vans = await fetchAllVanHires(userId)
		if (!vans || vans.length === 0) return true

		// Check for manual adjustment entry
		const manualAdjustment = vans.find(v => v.registration === 'MANUAL_DEPOSIT_ADJUSTMENT')
		const manualDepositAmount = manualAdjustment?.deposit_paid ?? 0

		// Filter out manual adjustment entry and sort by on_hire_date chronologically
		const actualVans = vans.filter(v => v.registration !== 'MANUAL_DEPOSIT_ADJUSTMENT')
		if (actualVans.length === 0) return true // Only manual adjustment exists

		const sortedVans = [...actualVans].sort(
			(a, b) =>
				new Date(a.on_hire_date).getTime() - new Date(b.on_hire_date).getTime()
		)

		// Find the earliest on-hire date to establish week 1
		const firstVanDate = new Date(sortedVans[0].on_hire_date)

		// Start with manual deposit amount (if any)
		let totalDepositPaidSoFar = manualDepositAmount
		const MAX_DEPOSIT = 50000 // £500 in pence
		const WEEK_1_2_RATE = 2500 // £25 in pence
		const WEEK_3_PLUS_RATE = 5000 // £50 in pence

		// Calculate starting week based on manual deposit
		// If manual deposit is £50+, they've completed the £25/week period
		// £25 x 2 weeks = £50, so week 3+ starts at £50
		let weekOffset = 0
		if (manualDepositAmount >= 5000) { // £50 or more
			// Calculate how many weeks of £25/week this represents (max 2)
			weekOffset = Math.min(2, Math.floor(manualDepositAmount / 2500))
		}

		// Calculate deposit for each van
		// NOTE: Deposits are NOT paid during the week the van is on hire
		// They are paid 2 weeks later (when the paycheck arrives)
		// However, for van deposit tracking, we associate the deposit with the van that triggered it
		for (const van of sortedVans) {
			if (totalDepositPaidSoFar >= MAX_DEPOSIT) {
				// Already paid full deposit, this van pays nothing
				if (van.deposit_paid !== 0) {
					await supabase
						.from('van_hires')
						.update({ deposit_paid: 0 })
						.eq('id', van.id)
				}
				continue
			}

			// Calculate which weeks this van covers
			const vanStart = new Date(van.on_hire_date)
			const today = new Date()

			// For deposit calculation, we only count weeks where payment has been RECEIVED
			// Payments are received 2 weeks after work (Week N work → Week N+2 payment)
			// So we need to subtract 2 weeks from today to get the latest work week that's been paid
			const latestPaidWorkWeekEnd = new Date(today)
			latestPaidWorkWeekEnd.setDate(latestPaidWorkWeekEnd.getDate() - 14) // 2 weeks ago

			// For active vans, use the latest paid work week as the end date for deposit calculation
			// For off-hired vans, use the actual off-hire date
			const vanEnd = van.off_hire_date
				? new Date(van.off_hire_date)
				: latestPaidWorkWeekEnd

			// Calculate number of weeks from first van hire to start of this van
			const daysSinceFirstVan = Math.ceil(
				(vanStart.getTime() - firstVanDate.getTime()) / (1000 * 60 * 60 * 24)
			)
			const weeksSinceFirstVan = Math.floor(daysSinceFirstVan / 7)

			// Calculate number of weeks this van was/is on hire
			// Include both start and end dates
			const vanDurationDays = Math.ceil(
				(vanEnd.getTime() - vanStart.getTime()) / (1000 * 60 * 60 * 24)
			) + 1
			// Round up partial weeks (any part of a week counts as a full week for deposits)
			const vanDurationWeeks = Math.ceil(vanDurationDays / 7)

			// Calculate deposits for each week this van was active
			// Each week with a van triggers a deposit payment (2 weeks later in reality, but we track it here)
			let depositForThisVan = 0
			for (let i = 0; i < vanDurationWeeks; i++) {
				if (totalDepositPaidSoFar >= MAX_DEPOSIT) break

				// Calculate which "week with van" this is (1st, 2nd, 3rd, etc.)
				// Apply week offset from manual deposit
				const weekWithVanNumber = weeksSinceFirstVan + i + 1 + weekOffset
				const weekRate = weekWithVanNumber <= 2 ? WEEK_1_2_RATE : WEEK_3_PLUS_RATE
				const depositThisWeek = Math.min(
					weekRate,
					MAX_DEPOSIT - totalDepositPaidSoFar
				)

				depositForThisVan += depositThisWeek
				totalDepositPaidSoFar += depositThisWeek
			}

			// Update this van's deposit_paid if it changed
			if (van.deposit_paid !== depositForThisVan) {
				await supabase
					.from('van_hires')
					.update({ deposit_paid: depositForThisVan })
					.eq('id', van.id)
			}
		}

		return true
	} catch (error) {
		console.error('Error recalculating deposits:', error)
		return false
	}
}

/**
 * Manually set total deposit paid
 * This creates/updates a special "manual adjustment" van hire entry to account for
 * deposits paid before using the app
 */
export async function setManualDepositAdjustment(
	userId: string,
	amount: number
): Promise<boolean> {
	try {
		// Check if there's already a manual adjustment entry
		const { data: existing } = await supabase
			.from('van_hires')
			.select('*')
			.eq('user_id', userId)
			.eq('registration', 'MANUAL_DEPOSIT_ADJUSTMENT')
			.single()

		if (existing) {
			// Update existing adjustment
			const { error } = await supabase
				.from('van_hires')
				.update({ deposit_paid: amount })
				.eq('id', existing.id)

			if (error) throw error
		} else {
			// Create new adjustment entry
			const { error } = await supabase.from('van_hires').insert({
				user_id: userId,
				registration: 'MANUAL_DEPOSIT_ADJUSTMENT',
				van_type: null,
				weekly_rate: 0,
				on_hire_date: new Date().toISOString().split('T')[0],
				off_hire_date: new Date().toISOString().split('T')[0],
				deposit_paid: amount,
				deposit_complete: amount >= 50000,
				deposit_refunded: false,
				deposit_refund_amount: null,
				deposit_hold_until: null,
				notes: 'Manual deposit adjustment for deposits paid before using this app',
			})

			if (error) throw error
		}

		return true
	} catch (error) {
		console.error('Error setting manual deposit adjustment:', error)
		return false
	}
}

/**
 * Fetch all van hires active during a specific week
 * Returns vans where the week period overlaps with the van hire period
 */
export async function fetchVanHiresForWeek(
	userId: string,
	weekStartDate: Date,
	weekEndDate: Date
): Promise<VanHire[]> {
	try {
		const weekStart = weekStartDate.toISOString().split('T')[0]
		const weekEnd = weekEndDate.toISOString().split('T')[0]

		const { data, error } = await supabase
			.from('van_hires')
			.select('*')
			.eq('user_id', userId)
			.lte('on_hire_date', weekEnd)
			.or(`off_hire_date.is.null,off_hire_date.gte.${weekStart}`)
			.order('on_hire_date', { ascending: true })

		if (error) throw error
		return data || []
	} catch (error) {
		console.error('Error fetching van hires for week:', error)
		return []
	}
}
