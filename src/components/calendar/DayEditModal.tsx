import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/useAuth'
import {
	deleteWorkDay as apiDeleteWorkDay,
	updateWorkDay as apiUpdateWorkDay,
	createWorkDay,
	getOrCreateWeek,
} from '@/lib/api/weeks'
import { dateToWeekNumber } from '@/lib/dates'
import { useSettingsStore } from '@/store/settingsStore'
import { getWeekKey, useWeeksStore } from '@/store/weeksStore'
import type { Week, WorkDay } from '@/types/database'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, isSameDay } from 'date-fns'
import { Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const workDaySchema = z.object({
	route_type: z.enum(['Normal', 'DRS']),
	route_number: z.string().optional(),
	stops_given: z.number().min(0).max(200),
	stops_taken: z.number().min(0).max(200),
	amazon_paid_miles: z.number().min(0).optional(),
	van_logged_miles: z.number().min(0).optional(),
	notes: z.string().optional(),
})

type WorkDayFormData = z.infer<typeof workDaySchema>

interface DayEditModalProps {
	date: Date
	weekData: Week | undefined
	onClose: () => void
}

export default function DayEditModal({
	date,
	weekData,
	onClose,
}: DayEditModalProps) {
	const { user } = useAuth()
	const { settings } = useSettingsStore()
	const {
		setWeek,
		addWorkDay: addWorkDayToCache,
		updateWorkDay: updateWorkDayInCache,
		removeWorkDay,
	} = useWeeksStore()
	const [isDeleting, setIsDeleting] = useState(false)

	// Use default settings if not loaded yet
	const currentSettings = settings || {
		user_id: user?.id || '',
		normal_rate: 16000, // £160
		drs_rate: 10000, // £100
		mileage_rate: 1988, // 19.88p per mile
		invoicing_service: 'Self-Invoicing' as const,
		created_at: '',
		updated_at: '',
	}

	// Find existing work day
	const existingWorkDay = weekData?.work_days?.find((wd: WorkDay) =>
		isSameDay(new Date(wd.date), date)
	)

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		control,
		formState: { errors, isSubmitting },
	} = useForm<WorkDayFormData>({
		resolver: zodResolver(workDaySchema),
		defaultValues: existingWorkDay
			? {
					route_type: existingWorkDay.route_type,
					route_number: existingWorkDay.route_number || '',
					stops_given: existingWorkDay.stops_given,
					stops_taken: existingWorkDay.stops_taken,
					amazon_paid_miles: existingWorkDay.amazon_paid_miles || undefined,
					van_logged_miles: existingWorkDay.van_logged_miles || undefined,
					notes: existingWorkDay.notes || '',
			  }
			: {
					route_type: 'Normal',
					route_number: '',
					stops_given: 0,
					stops_taken: 0,
					amazon_paid_miles: undefined,
					van_logged_miles: undefined,
					notes: '',
			  },
	})

	const routeType = watch('route_type')

	// Calculate daily rate based on route type
	const dailyRate =
		routeType === 'Normal'
			? currentSettings.normal_rate
			: currentSettings.drs_rate

	const onSubmit = async (data: WorkDayFormData) => {
		try {
			if (!user) {
				toast.error('User not authenticated')
				return
			}

			// Check if adding a new work day would exceed 6 days limit
			if (!existingWorkDay) {
				const currentDaysWorked = weekData?.work_days?.length || 0
				if (currentDaysWorked >= 6) {
					toast.error('Cannot work more than 6 days per week (legal limit)')
					return
				}
			}

			// Get week info for this date
			const weekInfo = dateToWeekNumber(date)

			// Get or create week if it doesn't exist
			let week = weekData
			if (!week) {
				toast.info('Creating week record...')
				week = await getOrCreateWeek(
					user.id,
					weekInfo.week,
					weekInfo.year,
					currentSettings.mileage_rate
				)
			}

			const workDayData = {
				week_id: week.id,
				date: format(date, 'yyyy-MM-dd'),
				route_type: data.route_type,
				route_number: data.route_number || null,
				daily_rate: dailyRate,
				stops_given: data.stops_given,
				stops_taken: data.stops_taken,
				amazon_paid_miles: data.amazon_paid_miles || null,
				van_logged_miles: data.van_logged_miles || null,
				mileage_rate: week.mileage_rate || currentSettings.mileage_rate,
				notes: data.notes || null,
			}

			let savedWorkDay: WorkDay

			if (existingWorkDay) {
				// Update existing work day
				savedWorkDay = await apiUpdateWorkDay(existingWorkDay.id, workDayData)

				// Update cache
				const weekKey = getWeekKey(weekInfo.week, weekInfo.year)
				updateWorkDayInCache(weekKey, existingWorkDay.id, savedWorkDay)

				toast.success('Work day updated successfully')
			} else {
				// Create new work day
				savedWorkDay = await createWorkDay(workDayData)

				// Update cache
				const weekKey = getWeekKey(weekInfo.week, weekInfo.year)

				// If week wasn't in cache, add it
				if (!weekData) {
					setWeek(week, [savedWorkDay])
				} else {
					addWorkDayToCache(weekKey, savedWorkDay)
				}

				toast.success('Work day added successfully')
			}

			onClose()
		} catch (error) {
			console.error('Error saving work day:', error)
			toast.error('Failed to save work day')
		}
	}

	const handleDelete = async () => {
		if (!existingWorkDay || !user) return

		try {
			setIsDeleting(true)

			// Delete from database
			await apiDeleteWorkDay(existingWorkDay.id)

			// Remove from cache
			const weekInfo = dateToWeekNumber(date)
			const weekKey = getWeekKey(weekInfo.week, weekInfo.year)
			removeWorkDay(weekKey, existingWorkDay.id)

			toast.success('Work day deleted successfully')
			onClose()
		} catch (error) {
			console.error('Error deleting work day:', error)
			toast.error('Failed to delete work day')
		} finally {
			setIsDeleting(false)
		}
	}

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
			<div className='bg-slate-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between'>
					<div>
						<h2 className='text-2xl font-bold text-white'>
							{format(date, 'EEEE, MMMM d')}
						</h2>
						<p className='text-sm text-slate-400'>
							{existingWorkDay ? 'Edit work day' : 'Add work day'}
						</p>
					</div>
					<Button
						onClick={onClose}
						variant='ghost'
						size='icon'
						className='text-slate-400 hover:text-white hover:bg-white/10'
					>
						<X className='w-5 h-5' />
					</Button>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='p-6 space-y-6'
				>
					{/* Route Type */}
					<div>
						<Label className='text-slate-200'>Route Type</Label>
						<div className='flex gap-3 mt-2'>
							<button
								type='button'
								onClick={() => setValue('route_type', 'Normal')}
								className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
									routeType === 'Normal'
										? 'bg-blue-500/20 border-blue-500 text-blue-400'
										: 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 cursor-pointer'
								}`}
							>
								<div className='font-semibold'>Normal</div>
								<div className='text-sm'>
									£{(currentSettings.normal_rate / 100).toFixed(2)}
								</div>
							</button>
							<button
								type='button'
								onClick={() => setValue('route_type', 'DRS')}
								className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
									routeType === 'DRS'
										? 'bg-purple-500/20 border-purple-500 text-purple-400'
										: 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 cursor-pointer'
								}`}
							>
								<div className='font-semibold'>DRS</div>
								<div className='text-sm'>
									£{(currentSettings.drs_rate / 100).toFixed(2)}
								</div>
							</button>
						</div>
					</div>

					{/* Route Number */}
					<div>
						<Label
							htmlFor='route_number'
							className='text-slate-200'
						>
							Route Number (Optional)
						</Label>
						<Input
							id='route_number'
							{...register('route_number')}
							placeholder='DA4-123'
							className='mt-2 bg-white/5 border-white/10 text-white'
						/>
					</div>

					{/* Sweeps Section */}
					<div>
						<Label className='text-slate-200 mb-3 block'>
							Sweeps (Optional)
						</Label>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='stops_given'
									className='text-emerald-400 font-medium flex items-center gap-1'
								>
									<span>✓</span> Stops You Helped With
								</Label>
								<Controller
									name='stops_given'
									control={control}
									render={({ field }) => (
										<NumberInput
											{...field}
											id='stops_given'
											min={0}
											max={200}
											className='mt-2 bg-emerald-500/5 border-emerald-500/20 text-white focus:ring-emerald-500'
										/>
									)}
								/>
								<p className='text-xs text-emerald-400/60 mt-1'>
									Stops you took from others (+£1 each)
								</p>
								{errors.stops_given && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.stops_given.message}
									</p>
								)}
							</div>
							<div>
								<Label
									htmlFor='stops_taken'
									className='text-red-400 font-medium flex items-center gap-1'
								>
									<span>✗</span> Stops Others Helped With
								</Label>
								<Controller
									name='stops_taken'
									control={control}
									render={({ field }) => (
										<NumberInput
											{...field}
											id='stops_taken'
											min={0}
											max={200}
											className='mt-2 bg-red-500/5 border-red-500/20 text-white focus:ring-red-500'
										/>
									)}
								/>
								<p className='text-xs text-red-400/60 mt-1'>
									Stops others took from you (-£1 each)
								</p>
								{errors.stops_taken && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.stops_taken.message}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Mileage Section */}
					<div>
						<Label className='text-slate-200 mb-3 block'>
							Mileage (Optional)
						</Label>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='van_logged_miles'
									className='text-slate-200 font-medium'
								>
									Van Odometer Miles
								</Label>
								<Controller
									name='van_logged_miles'
									control={control}
									render={({ field }) => (
										<NumberInput
											{...field}
											id='van_logged_miles'
											min={0}
											placeholder='98'
											className='mt-2 bg-white/5 border-white/10 text-white font-mono'
										/>
									)}
								/>
								<p className='text-xs text-slate-400 mt-1'>
									Actual miles driven (from van)
								</p>
							</div>
							<div>
								<Label
									htmlFor='amazon_paid_miles'
									className='text-slate-200 font-medium'
								>
									Amazon Paid Miles
								</Label>
								<Controller
									name='amazon_paid_miles'
									control={control}
									render={({ field }) => (
										<NumberInput
											{...field}
											id='amazon_paid_miles'
											min={0}
											placeholder='Leave blank until payslip'
											className='mt-2 bg-white/5 border-white/10 text-white font-mono'
										/>
									)}
								/>
								<p className='text-xs text-slate-400 mt-1'>
									From Amazon payslip (add later)
								</p>
							</div>
						</div>
					</div>

					{/* Notes */}
					<div>
						<Label
							htmlFor='notes'
							className='text-slate-200'
						>
							Notes (Optional)
						</Label>
						<Textarea
							id='notes'
							{...register('notes')}
							placeholder='Any additional notes...'
							rows={3}
							className='mt-2 bg-white/5 border-white/10 text-white resize-none'
						/>
					</div>

					{/* Actions */}
					<div className='flex items-center justify-between pt-4 border-t border-white/10'>
						{existingWorkDay ? (
							<Button
								type='button'
								onClick={handleDelete}
								disabled={isDeleting}
								variant='ghost'
								className='text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer'
							>
								<Trash2 className='w-4 h-4 mr-2' />
								Delete
							</Button>
						) : (
							<div />
						)}
						<div className='flex gap-3'>
							<Button
								type='button'
								onClick={onClose}
								variant='ghost'
								className='text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer'
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isSubmitting}
								className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white cursor-pointer'
							>
								{isSubmitting ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}
