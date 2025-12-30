import { zodResolver } from '@hookform/resolvers/zod'
import { Briefcase, FileText, Loader2, Pencil } from 'lucide-react'
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
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { getWeekKey, useWeeksStore } from '@/store/weeksStore'
import type { WorkDay } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { DashboardTile } from './DashboardTile'

const workSchema = z.object({
	route_type: z.enum(['Normal', 'DRS', 'Manual']),
	route_number: z.string().min(1, 'Route number required'),
	daily_rate: z.number().min(1).optional(),
}).refine(
	(data) => {
		// If Manual route, daily_rate is required
		if (data.route_type === 'Manual') {
			return data.daily_rate && data.daily_rate > 0
		}
		return true
	},
	{
		message: 'Daily rate is required for manual route entries',
		path: ['daily_rate'],
	}
)

type WorkFormData = z.infer<typeof workSchema>

interface QuickAddWorkTileProps {
	onWorkAdded?: () => void
}

export function QuickAddWorkTile({ onWorkAdded }: QuickAddWorkTileProps) {
	const { user } = useAuth()
	const { userProfile } = useAuthStore()
	const { settings } = useSettingsStore()
	const updateWorkDayInStore = useWeeksStore((state) => state.updateWorkDay)
	const addWorkDayToStore = useWeeksStore((state) => state.addWorkDay)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [todayWork, setTodayWork] = useState<WorkDay | null>(null)
	const [isEditing, setIsEditing] = useState(false)

	const today = new Date()
	const todayString = today.toISOString().split('T')[0]
	const currentHour = today.getHours()
	const isAfter3pm = currentHour >= 15

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<WorkFormData>({
		resolver: zodResolver(workSchema),
		defaultValues: {
			route_type: 'Normal',
			route_number: '',
			daily_rate: undefined,
		},
	})

	const routeType = watch('route_type')

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
				route_type: todayWork.route_type as 'Normal' | 'DRS' | 'Manual',
				route_number: todayWork.route_number || '',
				daily_rate: todayWork.route_type === 'Manual' ? todayWork.daily_rate : undefined,
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
					data.route_type === 'Manual'
						? data.daily_rate || 0
						: data.route_type === 'Normal'
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
					data.route_type === 'Manual'
						? data.daily_rate || 0
						: data.route_type === 'Normal'
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
		} catch (error) {
			console.error('Error adding/updating work:', error)
			if (error instanceof Error && error.message?.includes('duplicate')) {
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
					<div className='bg-[var(--bg-surface-secondary)] rounded-lg p-4 space-y-2'>
						<div className='flex justify-between items-start'>
							<div>
								<p className='text-[var(--text-secondary)] text-xs'>
									Route Type
								</p>
								<p className='text-[var(--text-primary)] font-semibold'>
									{todayWork.route_type}
									{todayWork.route_type === 'Manual' && (
										<span className='text-xs text-[var(--text-secondary)] ml-1'>
											(£{(todayWork.daily_rate / 100).toFixed(2)})
										</span>
									)}
								</p>
							</div>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setIsEditing(true)}
								className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] h-8 w-8 px-5'
								aria-label="Edit today's work"
							>
								<Pencil
									className='w-4 h-4 text-[var(--text-mileage-van)]'
									aria-hidden='true'
								/>
							</Button>
						</div>
						<div className='flex justify-between items-start'>
							<div>
								<p className='text-[var(--text-secondary)] text-xs'>
									Route Number
								</p>
								<p className='text-[var(--text-primary)] font-semibold'>
									{todayWork.route_number}
								</p>
							</div>
							{todayWork.route_number && (
								<Button
									variant='ghost'
									onClick={() => {
										const formData = {
											RouteNumber: todayWork.route_number,
											Date: todayWork.date,
											Name: {
												First: userProfile?.first_name || '',
												Last: userProfile?.last_name || '',
											},
											Tolls: ['NO TOLLS'],
											Declaration: {
												Name: {
													First: userProfile?.first_name || '',
													Last: userProfile?.last_name || '',
												},
												Date: todayWork.date,
											},
										}
										const url = `https://www.cognitoforms.com/CEMPSUKLTD1/ReceiptOfWorkAndDailyVanChecks2?entry=${encodeURIComponent(
											JSON.stringify(formData)
										)}`
										window.open(url, '_blank')
									}}
									className={`flex flex-col items-center gap-0.5 h-auto py-1 px-2 ${
										isAfter3pm ? 'animate-pulse-emerald' : 'text-emerald-500'
									} hover:text-emerald-400 hover:bg-[var(--bg-hover)]`}
									aria-label='Submit Receipt of Work'
								>
									<FileText
										className='w-4 h-4'
										aria-hidden='true'
									/>
									<span className='text-[0.5rem] font-medium leading-none'>
										RoW
									</span>
								</Button>
							)}
						</div>
					</div>
					<div className='space-y-1'>
						<p className='text-[var(--text-secondary)] text-xs text-center'>
							Work logged for today
						</p>
						{isAfter3pm && (
							<p className='text-red-500 text-xs text-center font-medium'>
								Remember to fill in your receipt of work using the green button
								above
							</p>
						)}
					</div>
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
										<SelectItem
											value='Manual'
											className='text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]'
										>
											Manual (Custom)
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					{routeType === 'Manual' && (
						<div>
							<Label
								htmlFor='daily_rate'
								className='text-[var(--input-label)] text-sm'
							>
								Daily Rate (£) *
							</Label>
							<Controller
								name='daily_rate'
								control={control}
								render={({ field }) => (
									<NumberInput
										{...field}
										id='daily_rate'
										value={field.value ? field.value / 100 : undefined}
										onChange={(val) => field.onChange(val ? Math.round(val * 100) : undefined)}
										min={0.01}
										step={0.01}
										placeholder='e.g. 180.00'
										className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-1 font-mono'
										chevronSize='sm'
									/>
								)}
							/>
							{errors.daily_rate && (
								<p className='text-[var(--input-error-text)] text-xs mt-1'>
									{errors.daily_rate.message}
								</p>
							)}
						</div>
					)}

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
					className='self-center w-1/2 h-10 mt-2 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-white font-semibold shadow-lg'
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
