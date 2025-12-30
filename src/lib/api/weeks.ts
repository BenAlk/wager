/**
 * Week and Work Day API functions
 * Handles CRUD operations for weeks and work days in Supabase
 */

import { supabase } from '@/lib/supabase';
import type { Week, WorkDay, Inserts, Updates, PerformanceLevel } from '@/types/database';

/**
 * Get or create a week record for a given week number and year
 */
export async function getOrCreateWeek(
	userId: string,
	weekNumber: number,
	year: number,
	defaultMileageRate: number = 1988, // 19.88p per mile
	defaultInvoicingService: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full' = 'Self-Invoicing'
): Promise<Week> {
	// First, try to get existing week - use maybeSingle() to avoid 406 error
	const { data: existingWeek, error: fetchError } = await supabase
		.from('weeks')
		.select('*')
		.eq('user_id', userId)
		.eq('week_number', weekNumber)
		.eq('year', year)
		.maybeSingle();

	if (fetchError) {
		throw fetchError;
	}

	if (existingWeek) {
		return existingWeek;
	}

	// Week doesn't exist, create it
	const { data: newWeek, error: createError } = await supabase
		.from('weeks')
		.insert({
			user_id: userId,
			week_number: weekNumber,
			year: year,
			bonus_amount: 0,
			mileage_rate: defaultMileageRate,
			invoicing_service: defaultInvoicingService,
		})
		.select()
		.single();

	if (createError) throw createError;
	if (!newWeek) throw new Error('Failed to create week');

	return newWeek;
}

/**
 * Fetch week with all work days
 */
export async function fetchWeekWithWorkDays(
	userId: string,
	weekNumber: number,
	year: number
): Promise<{ week: Week; workDays: WorkDay[] } | null> {
	// Fetch week - use maybeSingle() to avoid 406 error when no rows exist
	const { data: week, error: weekError } = await supabase
		.from('weeks')
		.select('*')
		.eq('user_id', userId)
		.eq('week_number', weekNumber)
		.eq('year', year)
		.maybeSingle();

	if (weekError) {
		throw weekError;
	}

	// No week exists yet
	if (!week) {
		return null;
	}

	// Fetch work days for this week
	const { data: workDays, error: workDaysError } = await supabase
		.from('work_days')
		.select('*')
		.eq('week_id', week.id)
		.order('date', { ascending: true });

	if (workDaysError) throw workDaysError;

	return {
		week,
		workDays: workDays || [],
	};
}

/**
 * Create a new work day
 */
export async function createWorkDay(
	workDay: Inserts<'work_days'>
): Promise<WorkDay> {
	const { data, error } = await supabase
		.from('work_days')
		.insert(workDay)
		.select()
		.single();

	if (error) throw error;
	if (!data) throw new Error('Failed to create work day');

	return data;
}

/**
 * Update an existing work day
 */
export async function updateWorkDay(
	workDayId: string,
	updates: Updates<'work_days'>
): Promise<WorkDay> {
	const { data, error } = await supabase
		.from('work_days')
		.update(updates)
		.eq('id', workDayId)
		.select()
		.single();

	if (error) throw error;
	if (!data) throw new Error('Failed to update work day');

	return data;
}

/**
 * Delete a work day
 */
export async function deleteWorkDay(workDayId: string): Promise<void> {
	const { error } = await supabase
		.from('work_days')
		.delete()
		.eq('id', workDayId);

	if (error) throw error;
}

/**
 * Update week rankings (performance levels)
 */
export async function updateWeekRankings(
	weekId: string,
	individualLevel: PerformanceLevel,
	companyLevel: PerformanceLevel,
	bonusAmount: number
): Promise<Week> {
	const { data, error } = await supabase
		.from('weeks')
		.update({
			individual_level: individualLevel,
			company_level: companyLevel,
			bonus_amount: bonusAmount,
			rankings_entered_at: new Date().toISOString(),
		})
		.eq('id', weekId)
		.select()
		.single();

	if (error) throw error;
	if (!data) throw new Error('Failed to update week rankings');

	return data;
}

/**
 * Update week mileage rate
 */
export async function updateWeekMileageRate(
	weekId: string,
	mileageRate: number
): Promise<Week> {
	// Update the week's mileage rate
	const { data, error } = await supabase
		.from('weeks')
		.update({
			mileage_rate: mileageRate,
		})
		.eq('id', weekId)
		.select()
		.single();

	if (error) throw error;
	if (!data) throw new Error('Failed to update week mileage rate');

	// Also update all work days in this week to use the new mileage rate
	const { error: workDaysError } = await supabase
		.from('work_days')
		.update({
			mileage_rate: mileageRate,
		})
		.eq('week_id', weekId);

	if (workDaysError) throw workDaysError;

	return data;
}

/**
 * Delete a week and all associated work days
 * This will cascade delete all work_days due to foreign key constraint
 */
export async function deleteWeek(weekId: string): Promise<void> {
	const { error } = await supabase
		.from('weeks')
		.delete()
		.eq('id', weekId);

	if (error) throw error;
}
