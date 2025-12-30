import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
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
import { motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const workDaySchema = z.object({
	route_type: z.enum(['Normal', 'DRS', 'Manual']),
	route_number: z.string().optional(),
	daily_rate: z.number().min(1).optional(), // Required when Manual route type
	stops_given: z.number().min(0).max(200),
	stops_taken: z.number().min(0).max(200),
	amazon_paid_miles: z.number().min(0).optional(),
	van_logged_miles: z.number().min(0).optional(),
	notes: z.string().optional(),
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
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
					daily_rate: existingWorkDay.route_type === 'Manual' ? existingWorkDay.daily_rate : undefined,
					stops_given: existingWorkDay.stops_given,
					stops_taken: existingWorkDay.stops_taken,
					amazon_paid_miles: existingWorkDay.amazon_paid_miles || undefined,
					van_logged_miles: existingWorkDay.van_logged_miles || undefined,
					notes: existingWorkDay.notes || '',
			  }
			: {
					route_type: 'Normal',
					route_number: '',
					daily_rate: undefined,
					stops_given: 0,
					stops_taken: 0,
					amazon_paid_miles: undefined,
					van_logged_miles: undefined,
					notes: '',
			  },
	})

	const routeType = watch('route_type')
	const manualRate = watch('daily_rate')

	// Calculate daily rate based on route type
	const dailyRate =
		routeType === 'Manual'
			? (manualRate || 0)
			: routeType === 'Normal'
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
					currentSettings.mileage_rate,
					currentSettings.invoicing_service
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

	const handleDeleteClick = () => {
		setShowDeleteConfirm(true)
	}

	const handleDeleteConfirm = async () => {
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
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--modal-overlay)] backdrop-blur-sm'
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				exit={{ opacity: 0, scale: 0.95, y: 20 }}
				transition={{ duration: 0.2, ease: 'easeOut' }}
				className='bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'
			>
				{/* Header */}
				<div className='sticky top-0 z-10 bg-[var(--modal-bg)] border-b border-[var(--border-secondary)] p-6 flex items-center justify-between'>
					<div>
						<h2 className='text-2xl font-bold text-[var(--modal-title)]'>
							{format(date, 'EEEE, MMMM d')}
						</h2>
						<p className='text-sm text-[var(--modal-description)]'>
							{existingWorkDay ? 'Edit work day' : 'Add work day'}
						</p>
					</div>
					<Button
						onClick={onClose}
						variant='ghost'
						size='icon'
						className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
						aria-label='Close work day form'
					>
						<X className='w-5 h-5' aria-hidden='true' />
					</Button>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='p-6 space-y-6'
				>
					{/* Route Type */}
					<div>
						<Label className='text-[var(--input-label)]'>Route Type</Label>
						<div className='grid grid-cols-3 gap-3 mt-2'>
							<button
								type='button'
								onClick={() => {
									setValue('route_type', 'Normal')
									setValue('daily_rate', undefined)
								}}
								className={`py-3 px-4 rounded-lg border transition-all ${
									routeType === 'Normal'
										? 'bg-[var(--bg-route-normal)] border-[var(--border-route-normal)] text-[var(--text-route-normal)]'
										: 'bg-[var(--bg-surface-tertiary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer'
								}`}
							>
								<div className='font-semibold'>Normal</div>
								<div className='text-sm'>
									£{(currentSettings.normal_rate / 100).toFixed(2)}
								</div>
							</button>
							<button
								type='button'
								onClick={() => {
									setValue('route_type', 'DRS')
									setValue('daily_rate', undefined)
								}}
								className={`py-3 px-4 rounded-lg border transition-all ${
									routeType === 'DRS'
										? 'bg-[var(--bg-route-drs)] border-[var(--border-route-drs)] text-[var(--text-route-drs)]'
										: 'bg-[var(--bg-surface-tertiary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer'
								}`}
							>
								<div className='font-semibold'>DRS</div>
								<div className='text-sm'>
									£{(currentSettings.drs_rate / 100).toFixed(2)}
								</div>
							</button>
							<button
								type='button'
								onClick={() => setValue('route_type', 'Manual')}
								className={`py-3 px-4 rounded-lg border transition-all ${
									routeType === 'Manual'
										? 'bg-[var(--bg-route-normal)] border-[var(--border-route-normal)] text-[var(--text-route-normal)]'
										: 'bg-[var(--bg-surface-tertiary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer'
								}`}
							>
								<div className='font-semibold'>Manual</div>
								<div className='text-xs'>Custom Rate</div>
							</button>
						</div>
					</div>

					{/* Manual Rate Input - Only shown when Manual is selected */}
					{routeType === 'Manual' && (
						<div>
							<Label
								htmlFor='daily_rate'
								className='text-[var(--input-label)]'
							>
								Daily Rate (£) <span className='text-[var(--text-error)]'>*</span>
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
										placeholder='Enter rate (e.g. 180.00 for LWB, 195.00 for 9.5hr)'
										className='mt-2 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] font-mono'
										chevronSize='sm'
									/>
								)}
							/>
							<p className='text-xs text-[var(--text-secondary)] mt-1'>
								For special routes: LWB (£180-200), 9.5hr (£195), etc.
							</p>
							{errors.daily_rate && (
								<p className='text-[var(--input-error-text)] text-sm mt-1'>
									{errors.daily_rate.message}
								</p>
							)}
						</div>
					)}

					{/* Route Number */}
					<div>
						<Label
							htmlFor='route_number'
							className='text-[var(--input-label)]'
						>
							Route Number (Optional)
						</Label>
						<Input
							id='route_number'
							{...register('route_number')}
							placeholder='DA4-123'
							className='mt-2 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)]'
						/>
					</div>

					{/* Sweeps Section */}
					<div>
						<Label className='text-[var(--input-label)] mb-3 block'>
							Sweeps (Optional)
						</Label>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='stops_taken'
									className='text-[var(--text-sweeps-given)] font-medium flex items-center gap-1'
								>
									<span>✓</span> Stops You Swept
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
											chevronSize='sm'
											className='mt-2 bg-[var(--bg-success)] border-[var(--border-success)] text-[var(--input-text)] focus:ring-[var(--text-success)]'
										/>
									)}
								/>
								<p className='text-xs text-[var(--text-sweeps-given)]/60 mt-1'>
									You helped behind drivers (+£1 each)
								</p>
								{errors.stops_taken && (
									<p className='text-[var(--input-error-text)] text-sm mt-1'>
										{errors.stops_taken.message}
									</p>
								)}
							</div>
							<div>
								<Label
									htmlFor='stops_given'
									className='text-[var(--text-sweeps-taken)] font-medium flex items-center gap-1'
								>
									<span>✗</span> Stops Others Swept For You
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
											chevronSize='sm'
											className='mt-2 bg-[var(--bg-error)] border-[var(--border-error)] text-[var(--input-text)] focus:ring-[var(--text-error)]'
										/>
									)}
								/>
								<p className='text-xs text-[var(--text-sweeps-taken)]/60 mt-1'>
									Others helped you (-£1 each)
								</p>
								{errors.stops_given && (
									<p className='text-[var(--input-error-text)] text-sm mt-1'>
										{errors.stops_given.message}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Mileage Section */}
					<div>
						<Label className='text-[var(--input-label)] mb-3 block'>
							Mileage (Optional)
						</Label>
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='van_logged_miles'
									className='text-[var(--input-label)] font-medium'
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
											chevronSize='sm'
											placeholder='98'
											className='mt-2 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] font-mono'
										/>
									)}
								/>
								<p className='text-xs text-[var(--text-secondary)] mt-1'>
									Actual miles driven (from van)
								</p>
							</div>
							<div>
								<Label
									htmlFor='amazon_paid_miles'
									className='text-[var(--input-label)] font-medium'
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
											chevronSize='sm'
											placeholder='Leave blank until payslip'
											className='mt-2 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] font-mono'
										/>
									)}
								/>
								<p className='text-xs text-[var(--text-secondary)] mt-1'>
									From Amazon payslip (add later)
								</p>
							</div>
						</div>
					</div>

					{/* Notes */}
					<div>
						<Label
							htmlFor='notes'
							className='text-[var(--input-label)]'
						>
							Notes (Optional)
						</Label>
						<Textarea
							id='notes'
							{...register('notes')}
							placeholder='Any additional notes...'
							rows={3}
							className='mt-2 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] resize-none'
						/>
					</div>

					{/* Actions */}
					<div className='flex items-center justify-between pt-4 border-t border-[var(--modal-border)]'>
						{existingWorkDay ? (
							<Button
								type='button'
								onClick={handleDeleteClick}
								disabled={isDeleting}
								variant='ghost'
								className='text-[var(--button-destructive-text)] hover:text-[var(--button-destructive-hover)] hover:bg-[var(--button-destructive-bg)] cursor-pointer'
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
								className='text-[var(--button-ghost-text)] hover:text-[var(--button-ghost-hover)] hover:bg-[var(--bg-hover)] cursor-pointer'
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={isSubmitting}
								className='bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-hover)] text-[var(--button-primary-text)] cursor-pointer'
							>
								{isSubmitting ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</div>
				</form>
			</motion.div>

			{/* Delete Confirmation Dialog */}
			<ConfirmationDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleDeleteConfirm}
				title="Delete Work Day?"
				description={
					<>
						Are you sure you want to delete this work day for{' '}
						<strong>{format(date, 'EEEE, MMMM d')}</strong>?
						<br />
						<br />
						This will remove all data including route information, sweeps, and
						mileage. This action cannot be undone.
					</>
				}
				confirmText="Delete Work Day"
				cancelText="Cancel"
				variant="destructive"
				icon={<AlertTriangle className="w-6 h-6" />}
				isLoading={isDeleting}
			/>
		</motion.div>
	)
}
