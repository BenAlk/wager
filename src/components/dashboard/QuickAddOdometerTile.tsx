import { zodResolver } from '@hookform/resolvers/zod'
import { Gauge, Loader2, Pencil } from 'lucide-react'
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

const odometerSchema = z.object({
	van_logged_miles: z.number().min(0, 'Cannot be negative'),
})

type OdometerFormData = z.infer<typeof odometerSchema>

interface QuickAddOdometerTileProps {
	hasWorkToday: boolean
}

export function QuickAddOdometerTile({
	hasWorkToday,
}: QuickAddOdometerTileProps) {
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
		setValue,
		formState: { errors },
	} = useForm<OdometerFormData>({
		resolver: zodResolver(odometerSchema),
		defaultValues: {
			van_logged_miles: 0,
		},
	})

	// Fetch today's work on mount
	useEffect(() => {
		const fetchTodayWork = async () => {
			if (!user?.id) return

			const { week, year } = dateToWeekNumber(today)
			const weekData = await fetchWeekWithWorkDays(user.id, week, year)
			const work = weekData?.workDays?.find((wd) => wd.date === todayString)
			setTodayWork(work || null)

			// Set form values if work exists
			if (work && work.van_logged_miles !== null) {
				setValue('van_logged_miles', work.van_logged_miles)
			}
		}

		fetchTodayWork()
	}, [user?.id, todayString, setValue])

	const onSubmit = async (data: OdometerFormData) => {
		if (!user?.id) return

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

			// Update work day with van miles
			const updated = await updateWorkDay(todayWorkDay.id, {
				van_logged_miles: data.van_logged_miles,
			})

			if (updated) {
				toast.success('Odometer updated!', { duration: 3000 })
				setTodayWork(updated)
				setIsEditing(false)
				// Update the weeks store cache so calendar reflects the change
				const weekKey = getWeekKey(weekNum, year)
				updateWorkDayInStore(weekKey, updated.id, updated)
			} else {
				toast.error('Failed to update odometer')
			}
		} catch (error) {
			console.error('Error updating odometer:', error)
			toast.error('An error occurred')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Show odometer details if entered and not editing
	if (todayWork && todayWork.van_logged_miles !== null && todayWork.van_logged_miles > 0 && !isEditing) {
		return (
			<DashboardTile
				title='Quick Add Odometer'
				icon={Gauge}
			>
				<div className='flex flex-col h-full'>
					<div className='space-y-4 flex-1'>
						<div className='bg-[var(--bg-surface-secondary)] rounded-lg p-4'>
							<div className='flex justify-between items-start mb-2'>
								<div>
									<p className='text-[var(--text-secondary)] text-xs'>Van Logged Miles</p>
									<p className='text-[var(--text-primary)] font-semibold text-2xl'>
										{todayWork.van_logged_miles}
									</p>
								</div>
								<Button
									variant='ghost'
									size='icon'
									onClick={() => setIsEditing(true)}
									className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] h-8 w-8 mt-3'
									aria-label="Edit today's van miles"
								>
									<Pencil className='w-4 h-4 text-[var(--text-mileage-van)]' aria-hidden='true' />
								</Button>
							</div>
						</div>
						<p className='text-[var(--text-secondary)] text-xs text-center'>
							Odometer logged for today
						</p>
					</div>
				</div>
			</DashboardTile>
		)
	}

	return (
		<DashboardTile
			title='Quick Add Odometer'
			icon={Gauge}
			disabled={!hasWorkToday}
		>
			{!hasWorkToday ? (
				<div className='text-center py-8'>
					<p className='text-[var(--text-secondary)] text-sm'>
						Add work for today first to log miles
					</p>
				</div>
			) : (
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='flex flex-col items-center w-full h-full'
				>
					<div className='space-y-4 w-2/3'>
						<div>
							<Label
								htmlFor='van_logged_miles'
								className='text-[var(--input-label)] text-sm pt-5'
							>
								Van Logged Miles
							</Label>
							<Controller
								name='van_logged_miles'
								control={control}
								render={({ field }) => (
									<NumberInput
										id='van_logged_miles'
										value={field.value}
										onChange={field.onChange}
										min={0}
										chevronSize='sm'
										placeholder='Enter total miles'
										className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-1'
									/>
								)}
							/>
							{errors.van_logged_miles && (
								<p className='text-[var(--input-error-text)] text-xs mt-1'>
									{errors.van_logged_miles.message}
								</p>
							)}
						</div>
					</div>

					<Button
						type='submit'
						disabled={isSubmitting}
						className='self-center w-1/2 h-10 mt-auto bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-white font-semibold shadow-lg'
					>
						{isSubmitting ? (
							<>
								<Loader2 className='w-4 h-4 mr-2 animate-spin' />
								Updating...
							</>
						) : (
							'Update Odometer'
						)}
					</Button>
				</form>
			)}
		</DashboardTile>
	)
}
