import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Repeat2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useAuth } from '@/hooks/useAuth'
import { fetchWeekWithWorkDays, updateWorkDay } from '@/lib/api/weeks'
import { dateToWeekNumber } from '@/lib/dates'
import { useWeeksStore, getWeekKey } from '@/store/weeksStore'
import type { WorkDay } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { DashboardTile } from './DashboardTile'

const sweepsSchema = z.object({
	stops_given: z.number().min(0, 'Cannot be negative').max(200, 'Max 200'),
	stops_taken: z.number().min(0, 'Cannot be negative').max(200, 'Max 200'),
})

type SweepsFormData = z.infer<typeof sweepsSchema>

interface QuickAddSweepsTileProps {
	hasWorkToday: boolean
}

export function QuickAddSweepsTile({ hasWorkToday }: QuickAddSweepsTileProps) {
	const { user } = useAuth()
	const updateWorkDayInStore = useWeeksStore((state) => state.updateWorkDay)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [todayWork, setTodayWork] = useState<WorkDay | null>(null)
	const [isEditing, setIsEditing] = useState(false)

	const today = new Date()
	const todayString = today.toISOString().split('T')[0]

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<SweepsFormData>({
		resolver: zodResolver(sweepsSchema),
		defaultValues: {
			stops_given: 0,
			stops_taken: 0,
		},
	})

	const stopsGiven = watch('stops_given')
	const stopsTaken = watch('stops_taken')

	// Fetch today's work on mount
	useEffect(() => {
		const fetchTodayWork = async () => {
			if (!user?.id) return

			const { week, year } = dateToWeekNumber(today)
			const weekData = await fetchWeekWithWorkDays(user.id, week, year)
			const work = weekData?.workDays?.find((wd) => wd.date === todayString)
			setTodayWork(work || null)

			// Set form values if work exists
			if (work) {
				setValue('stops_given', work.stops_given)
				setValue('stops_taken', work.stops_taken)
			}
		}

		fetchTodayWork()
	}, [user?.id, todayString, setValue])

	const onSubmit = async (data: SweepsFormData) => {
		if (!user?.id) return

		// Validate total sweeps
		if (data.stops_given + data.stops_taken > 200) {
			toast.error('Total sweeps cannot exceed 200', { duration: 3000 })
			return
		}

		setIsSubmitting(true)
		try {
			const { week: weekNum, year } = dateToWeekNumber(today)

			// Fetch current week to get work day
			const result = await fetchWeekWithWorkDays(user.id, weekNum, year)
			if (!result || !result.workDays) {
				toast.error('No week data found')
				return
			}

			// Find today's work day
			const todayWorkDay = result.workDays.find((wd) => wd.date === todayString)
			if (!todayWorkDay) {
				toast.error('No work found for today')
				return
			}

			// Update work day with sweeps
			const updated = await updateWorkDay(todayWorkDay.id, {
				stops_given: data.stops_given,
				stops_taken: data.stops_taken,
			})

			if (updated) {
				toast.success('Sweeps updated!', { duration: 3000 })
				setTodayWork(updated)
				setIsEditing(false)
				// Update the weeks store cache so calendar reflects the change
				const weekKey = getWeekKey(weekNum, year)
				updateWorkDayInStore(weekKey, updated.id, updated)
			} else {
				toast.error('Failed to update sweeps')
			}
		} catch (error) {
			console.error('Error updating sweeps:', error)
			toast.error('An error occurred')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Show sweeps details if entered and not editing
	if (
		todayWork &&
		(todayWork.stops_given > 0 || todayWork.stops_taken > 0) &&
		!isEditing
	) {
		return (
			<DashboardTile
				title='Quick Add Sweeps'
				icon={Repeat2}
			>
				<div className='flex flex-col h-full'>
					<div className='space-y-4 flex-1'>
						<div className='bg-[var(--bg-surface-secondary)] rounded-lg p-4'>
							<div className='flex justify-between items-start mb-3'>
								<div className='flex-1'>
									<p className='text-[var(--text-secondary)] text-xs mb-1'>Stops Given</p>
									<p className='text-[var(--text-sweeps-taken)] font-semibold text-lg'>
										{todayWork.stops_given}
									</p>
									<p className='text-[var(--text-tertiary)] text-xs'>Others took from you</p>
								</div>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => setIsEditing(true)}
									className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] h-8 w-8'
								>
									<Pencil className='w-4 h-4 text-[var(--text-mileage-van)]' />
								</Button>
							</div>
							<div>
								<p className='text-[var(--text-secondary)] text-xs mb-1'>Stops Taken</p>
								<p className='text-[var(--text-sweeps-given)] font-semibold text-lg'>
									{todayWork.stops_taken}
								</p>
								<p className='text-[var(--text-tertiary)] text-xs'>You took from others</p>
							</div>
						</div>
						<p className='text-[var(--text-secondary)] text-xs text-center'>
							Sweeps logged for today
						</p>
					</div>
				</div>
			</DashboardTile>
		)
	}

	return (
		<DashboardTile
			title='Quick Add Sweeps'
			icon={Repeat2}
			disabled={!hasWorkToday}
		>
			{!hasWorkToday ? (
				<div className='text-center py-8'>
					<p className='text-[var(--text-secondary)] text-sm'>
						Add work for today first to enable sweeps
					</p>
				</div>
			) : (
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='flex flex-col items-center w-full h-full'
				>
					<div className='space-y-2 w-2/3'>
						<div>
							<Label
								htmlFor='stops_given'
								className='text-[var(--input-label)] text-sm'
							>
								Stops Given (Others took from you)
							</Label>
							<Controller
								name='stops_given'
								control={control}
								render={({ field }) => (
									<NumberInput
										id='stops_given'
										value={field.value}
										onChange={field.onChange}
										min={0}
										max={200}
										chevronSize='sm'
										className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)]'
									/>
								)}
							/>
							{errors.stops_given && (
								<p className='text-[var(--input-error-text)] text-xs mt-1'>
									{errors.stops_given.message}
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='stops_taken'
								className='text-[var(--input-label)] text-sm'
							>
								Stops Taken (You took from others)
							</Label>
							<Controller
								name='stops_taken'
								control={control}
								render={({ field }) => (
									<NumberInput
										id='stops_taken'
										value={field.value}
										onChange={field.onChange}
										min={0}
										max={200}
										chevronSize='sm'
										className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-1'
									/>
								)}
							/>
							{errors.stops_taken && (
								<p className='text-[var(--input-error-text)] text-xs mt-1'>
									{errors.stops_taken.message}
								</p>
							)}
						</div>

						{stopsGiven + stopsTaken > 200 && (
							<p className='text-[var(--input-error-text)] text-xs'>
								Total sweeps cannot exceed 200
							</p>
						)}
					</div>

					<Button
						type='submit'
						disabled={isSubmitting || stopsGiven + stopsTaken > 200}
						className='self-center w-1/2 h-10 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-white font-semibold shadow-lg mt-6'
					>
						{isSubmitting ? (
							<>
								<Loader2 className='w-4 h-4 mr-2 animate-spin' />
								Updating...
							</>
						) : (
							'Update Sweeps'
						)}
					</Button>
				</form>
			)}
		</DashboardTile>
	)
}
