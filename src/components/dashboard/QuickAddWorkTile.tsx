import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, Loader2, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useAuth } from '@/hooks/useAuth'
import {
	createWorkDay,
	fetchWeekWithWorkDays,
	getOrCreateWeek,
	updateWorkDay,
} from '@/lib/api/weeks'
import { dateToWeekNumber } from '@/lib/dates'
import { useSettingsStore } from '@/store/settingsStore'
import { useWeeksStore, getWeekKey } from '@/store/weeksStore'
import type { WorkDay } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { DashboardTile } from './DashboardTile'

const workSchema = z.object({
	route_type: z.enum(['Normal', 'DRS']),
	route_number: z.string().min(1, 'Route number required'),
})

type WorkFormData = z.infer<typeof workSchema>

interface QuickAddWorkTileProps {
	onWorkAdded?: () => void
}

export function QuickAddWorkTile({ onWorkAdded }: QuickAddWorkTileProps) {
	const { user } = useAuth()
	const { settings } = useSettingsStore()
	const updateWorkDayInStore = useWeeksStore((state) => state.updateWorkDay)
	const addWorkDayToStore = useWeeksStore((state) => state.addWorkDay)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [todayWork, setTodayWork] = useState<WorkDay | null>(null)
	const [isEditing, setIsEditing] = useState(false)

	const today = new Date()
	const todayString = today.toISOString().split('T')[0]

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<WorkFormData>({
		resolver: zodResolver(workSchema),
		defaultValues: {
			route_type: 'Normal',
			route_number: '',
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
		}

		fetchTodayWork()
	}, [user?.id, todayString])

	// Populate form when entering edit mode
	useEffect(() => {
		if (isEditing && todayWork) {
			reset({
				route_type: todayWork.route_type as 'Normal' | 'DRS',
				route_number: todayWork.route_number || '',
			})
		}
	}, [isEditing, todayWork, reset])

	const onSubmit = async (data: WorkFormData) => {
		if (!user?.id) return

		setIsSubmitting(true)
		try {
			const { week: weekNum, year } = dateToWeekNumber(today)

			// If editing existing work
			if (isEditing && todayWork) {
				// Determine daily rate from route type
				const dailyRate =
					data.route_type === 'Normal'
						? settings?.normal_rate || 16000
						: settings?.drs_rate || 10000

				const updated = await updateWorkDay(todayWork.id, {
					route_type: data.route_type,
					route_number: data.route_number,
					daily_rate: dailyRate,
				})

				if (updated) {
					toast.success('Work updated!', { duration: 3000 })
					setTodayWork(updated)
					setIsEditing(false)
					// Update the weeks store cache so calendar reflects the change
					const weekKey = getWeekKey(weekNum, year)
					updateWorkDayInStore(weekKey, updated.id, updated)
				} else {
					toast.error('Failed to update work')
				}
			} else {
				// Creating new work day
				// Get or create week
				const week = await getOrCreateWeek(user.id, weekNum, year)
				if (!week) {
					toast.error('Failed to create week')
					return
				}

				// Determine daily rate from route type
				const dailyRate =
					data.route_type === 'Normal'
						? settings?.normal_rate || 16000
						: settings?.drs_rate || 10000

				// Create work day
				const workDay = await createWorkDay({
					week_id: week.id,
					date: todayString,
					route_type: data.route_type,
					route_number: data.route_number,
					daily_rate: dailyRate,
					stops_given: 0,
					stops_taken: 0,
					amazon_paid_miles: 0,
					van_logged_miles: 0,
					notes: null,
				})

				if (workDay) {
					toast.success('Work added for today!', { duration: 3000 })
					setTodayWork(workDay)
					reset()
					// Add to weeks store cache so calendar reflects the change
					const weekKey = getWeekKey(weekNum, year)
					addWorkDayToStore(weekKey, workDay)
					onWorkAdded?.()
				} else {
					toast.error('Failed to add work')
				}
			}
		} catch (error: any) {
			console.error('Error adding/updating work:', error)
			if (error.message?.includes('duplicate')) {
				toast.error('Work already exists for today')
			} else {
				toast.error('An error occurred')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	// Show work details if already added and not editing
	if (todayWork && !isEditing) {
		return (
			<DashboardTile
				title='Quick Add Work'
				icon={Briefcase}
				data-tour='quick-add-work'
			>
				<div className='space-y-4'>
					<div className='bg-[var(--bg-surface-secondary)] rounded-lg p-4'>
						<div className='flex justify-between items-start mb-2'>
							<div>
								<p className='text-[var(--text-secondary)] text-xs'>Route Type</p>
								<p className='text-[var(--text-primary)] font-semibold'>
									{todayWork.route_type}
								</p>
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
							<p className='text-[var(--text-secondary)] text-xs'>Route Number</p>
							<p className='text-[var(--text-primary)] font-semibold'>
								{todayWork.route_number}
							</p>
						</div>
					</div>
					<p className='text-[var(--text-secondary)] text-xs text-center'>
						Work logged for today
					</p>
				</div>
			</DashboardTile>
		)
	}

	return (
		<DashboardTile
			title='Quick Add Work'
			icon={Briefcase}
			data-tour='quick-add-work'
		>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className='flex flex-col items-center w-full h-full'
			>
				<div className='space-y-1 w-2/3'>
					<div>
						<Label
							htmlFor='route_type'
							className='text-[var(--input-label)] text-sm'
						>
							Route Type
						</Label>
						<Controller
							name='route_type'
							control={control}
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
								>
									<SelectTrigger className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-1'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className='bg-[var(--modal-bg)] border-[var(--modal-border)]'>
										<SelectItem
											value='Normal'
											className='text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]'
										>
											Normal (£
											{((settings?.normal_rate || 16000) / 100).toFixed(0)})
										</SelectItem>
										<SelectItem
											value='DRS'
											className='text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]'
										>
											DRS (£{((settings?.drs_rate || 10000) / 100).toFixed(0)})
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					<div>
						<Label
							htmlFor='route_number'
							className='text-[var(--input-label)] text-sm'
						>
							Route Number
						</Label>
						<Controller
							name='route_number'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									id='route_number'
									placeholder='e.g., DA01'
									className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-1'
								/>
							)}
						/>
						{errors.route_number && (
							<p className='text-[var(--input-error-text)] text-xs mt-1'>
								{errors.route_number.message}
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
							{isEditing ? 'Updating...' : 'Adding...'}
						</>
					) : isEditing ? (
						'Confirm Edits'
					) : (
						'Add Work for Today'
					)}
				</Button>
			</form>
		</DashboardTile>
	)
}
