import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { useAuth } from '@/hooks/useAuth'
import { fetchVanHiresForWeek } from '@/lib/api/vans'
import {
	deleteWeek as deleteWeekAPI,
	fetchWeekWithWorkDays,
	updateWeekMileageRate,
	updateWeekRankings,
} from '@/lib/api/weeks'
import {
	calculateWeeklyPayBreakdown,
	getDailyBonusRate,
} from '@/lib/calculations'
import {
	getCurrentWeek,
	getPaymentWeekForBonus,
	getPaymentWeekForStandardPay,
	getWeekDateRange,
} from '@/lib/dates'
import { useVanStore } from '@/store/vanStore'
import { useWeeksStore } from '@/store/weeksStore'
import type { PerformanceLevel, VanHire, Week } from '@/types/database'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Check, ChevronDown, ChevronUp, FileText, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

/**
 * Rankings form validation schema
 */
const rankingsSchema = z.object({
	individual_level: z.enum(['Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+']),
	company_level: z.enum(['Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+']),
})

type RankingsFormData = z.infer<typeof rankingsSchema>

/**
 * Mileage rate form validation schema
 * Note: Stored as hundredths of penny (1988 = £0.1988/mile)
 * Validation happens on the STORED value (after Math.round conversion in onChange)
 */
const mileageRateSchema = z.object({
	mileage_rate: z
		.number({ message: 'Mileage rate is required' })
		.min(0, 'Mileage rate cannot be negative')
		.max(10000, 'Mileage rate cannot exceed £1.00 per mile'),
})

type MileageRateFormData = z.infer<typeof mileageRateSchema>

interface WeekSummaryProps {
	weekData: Week | undefined
	weekNumber: number
	year: number
}

export default function WeekSummary({
	weekData,
	weekNumber,
	year,
}: WeekSummaryProps) {
	const { user } = useAuth()
	const { updateWeek, deleteWeek, setWeek } = useWeeksStore()
	const { allVans } = useVanStore()

	const [isEditingRankings, setIsEditingRankings] = useState(false)
	const [isEditingMileageRate, setIsEditingMileageRate] = useState(false)
	const [showClearConfirm, setShowClearConfirm] = useState(false)
	const [isClearing, setIsClearing] = useState(false)
	const [weekVanHires, setWeekVanHires] = useState<VanHire[]>([])
	const [isExpanded, setIsExpanded] = useState(false)

	// Rankings form
	const {
		control: rankingsControl,
		handleSubmit: handleRankingsSubmit,
		reset: resetRankings,
		formState: { errors: rankingsErrors, isSubmitting: isSavingRankings },
	} = useForm<RankingsFormData>({
		resolver: zodResolver(rankingsSchema),
		defaultValues: {
			individual_level: 'Fantastic',
			company_level: 'Fantastic',
		},
	})

	// Mileage rate form
	const {
		control: mileageControl,
		handleSubmit: handleMileageSubmit,
		reset: resetMileageRate,
		formState: { errors: mileageErrors, isSubmitting: isSavingMileageRate },
	} = useForm<MileageRateFormData>({
		resolver: zodResolver(mileageRateSchema),
		defaultValues: {
			mileage_rate: 1988, // Default to 19.88p
		},
	})

	// Use default invoicing service if week doesn't have it yet (old data)
	const weekInvoicingService = weekData?.invoicing_service || 'Self-Invoicing'

	// Fetch vans active during this week
	useEffect(() => {
		const fetchVansForWeek = async () => {
			if (!user?.id) return

			const { startDate, endDate } = getWeekDateRange(weekNumber, year)
			const vans = await fetchVanHiresForWeek(user.id, startDate, endDate)
			setWeekVanHires(vans)
		}

		fetchVansForWeek()
	}, [user?.id, weekNumber, year])

	if (!weekData || !weekData.work_days || weekData.work_days.length === 0) {
		return (
			<div className='bg-[var(--bg-surface-secondary)] backdrop-blur-sm border border-[var(--border-secondary)] rounded-2xl p-6 mb-8'>
				<div className='flex items-center gap-3 mb-4'>
					<div className='w-10 h-10 bg-gradient-to-r from-[var(--tile-icon-enabled-from)] to-[var(--tile-icon-enabled-to)] rounded-lg flex items-center justify-center'>
						<FileText className='w-6 h-6 text-[var(--text-primary)]' />
					</div>
					<h3 className='text-xl font-bold text-[var(--text-primary)]'>
						Week {weekNumber} Summary
					</h3>
				</div>
				<p className='text-[var(--text-secondary)] text-center py-8'>
					No work days logged for this week
				</p>
			</div>
		)
	}

	// Calculate deposit paid before this week (not used since deposits aren't shown in work week)
	const { startDate: weekStart, endDate: weekEnd } = getWeekDateRange(
		weekNumber,
		year
	)
	const depositPaidBeforeWeek = allVans
		.filter((van) => new Date(van.on_hire_date) < weekStart)
		.reduce((sum, van) => sum + van.deposit_paid, 0)

	// Calculate pay breakdown using week's snapshotted invoicing service and vans
	// Note: Deposits are NOT included here - they are deducted in the payment week (Week N+2)
	const breakdown = calculateWeeklyPayBreakdown(
		weekData.work_days,
		weekInvoicingService,
		weekVanHires,
		weekStart,
		weekEnd,
		depositPaidBeforeWeek,
		0, // Paycheck number not used since deposits aren't included in work week
		false // Don't include deposit payment in work week, only in payment week
	)

	// Calculate payment weeks
	const standardPayWeek = getPaymentWeekForStandardPay(weekNumber, year)
	const bonusPayWeek = weekData.bonus_amount
		? getPaymentWeekForBonus(weekNumber, year)
		: null

	const daysWorked = weekData.work_days.length
	const hasBonusRankings = weekData.individual_level && weekData.company_level

	// Check if rankings are available yet (Week N+2 or later)
	const currentWeek = getCurrentWeek()
	const rankingsAvailableWeek = weekNumber + 2

	// Handle year boundary: Week 51 → Week 1 next year, Week 52 → Week 2 next year
	let rankingsAvailableYear = year
	let adjustedRankingsWeek = rankingsAvailableWeek

	if (rankingsAvailableWeek > 52) {
		rankingsAvailableYear = year + 1
		adjustedRankingsWeek = rankingsAvailableWeek - 52
	}

	// Rankings are available if:
	// 1. Current year is after the rankings year, OR
	// 2. Current year equals rankings year AND current week >= rankings week
	const areRankingsAvailable =
		currentWeek.year > rankingsAvailableYear ||
		(currentWeek.year === rankingsAvailableYear &&
			currentWeek.week >= adjustedRankingsWeek)

	const performanceLevels: PerformanceLevel[] = [
		'Poor',
		'Fair',
		'Great',
		'Fantastic',
		'Fantastic+',
	]

	const onRankingsSubmit = async (data: RankingsFormData) => {
		if (!user || !weekData) {
			toast.error('Unable to save rankings')
			return
		}

		try {
			// Calculate bonus amount
			const dailyBonus = getDailyBonusRate(data.individual_level, data.company_level)
			const bonusAmount = dailyBonus * daysWorked

			// Update in database
			await updateWeekRankings(
				weekData.id,
				data.individual_level,
				data.company_level,
				bonusAmount
			)

			// Update cache
			updateWeek(weekData.id, {
				individual_level: data.individual_level,
				company_level: data.company_level,
				bonus_amount: bonusAmount,
			})

			toast.success('Rankings saved successfully!')
			setIsEditingRankings(false)
		} catch (error) {
			console.error('Error saving rankings:', error)
			toast.error('Failed to save rankings')
		}
	}

	const handleEditRankings = () => {
		// Pre-populate with existing values
		resetRankings({
			individual_level: weekData?.individual_level || 'Fantastic',
			company_level: weekData?.company_level || 'Fantastic',
		})
		setIsEditingRankings(true)
	}

	const handleCancelRankingsEdit = () => {
		resetRankings()
		setIsEditingRankings(false)
	}

	const handleEditMileageRate = () => {
		resetMileageRate({
			mileage_rate: weekData?.mileage_rate || 1988, // Default to 19.88p if not set
		})
		setIsEditingMileageRate(true)
	}

	const onMileageRateSubmit = async (data: MileageRateFormData) => {
		if (!weekData || !user) return

		try {
			// Update the mileage rate on the week and all work days
			await updateWeekMileageRate(weekData.id, data.mileage_rate)

			// Refetch the week data to get updated work days with new mileage rate
			const result = await fetchWeekWithWorkDays(user.id, weekNumber, year)
			if (result) {
				setWeek(result.week, result.workDays)
			}

			toast.success('Mileage rate updated!')
			setIsEditingMileageRate(false)
		} catch (error) {
			console.error('Error updating mileage rate:', error)
			toast.error('Failed to update mileage rate')
		}
	}

	const handleCancelMileageEdit = () => {
		resetMileageRate()
		setIsEditingMileageRate(false)
	}

	const handleClearWeek = async () => {
		if (!weekData || !user) return

		try {
			setIsClearing(true)
			const weekKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`

			// Delete from database
			await deleteWeekAPI(weekData.id)

			// Remove from cache
			deleteWeek(weekKey)

			toast.success('Week cleared successfully')
			setShowClearConfirm(false)
		} catch (error) {
			console.error('Error clearing week:', error)
			toast.error('Failed to clear week')
		} finally {
			setIsClearing(false)
		}
	}

	return (
		<div className='bg-[var(--bg-surface-secondary)] backdrop-blur-xl border border-[var(--border-secondary)] rounded-2xl p-6 lg:p-8 mb-8'>
			{/* Header */}
			<div
				className='flex items-center justify-between mb-4 cursor-pointer'
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<div className='flex items-center gap-3'>
					<div className='w-10 h-10 bg-gradient-to-r from-[var(--tile-icon-enabled-from)] to-[var(--tile-icon-enabled-to)] rounded-lg flex items-center justify-center'>
						<FileText className='w-6 h-6 text-[var(--text-primary)]' />
					</div>
					<h3 className='text-2xl font-bold text-[var(--text-primary)]'>
						Week {weekNumber} Summary
					</h3>
				</div>
				<Button
					variant='ghost'
					size='sm'
					className='text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
				>
					{isExpanded ? <ChevronUp className='w-5 h-5' /> : <ChevronDown className='w-5 h-5' />}
				</Button>
			</div>

			{/* Total Earnings - Always Visible */}
			<div className='flex items-center justify-between mb-6'>
				<span className='text-lg font-semibold text-[var(--text-secondary)]'>
					Total Earnings
				</span>
				<span
					className={
						'text-2xl sm:text-3xl font-mono font-bold ' +
						(breakdown.standardPay + (weekData.bonus_amount || 0) < 0
							? 'text-[var(--finance-negative)]'
							: 'text-[var(--finance-positive)]')
					}
				>
					£
					{(
						(breakdown.standardPay + (weekData.bonus_amount || 0)) /
						100
					).toFixed(2)}
				</span>
			</div>

			{/* Expandable Content */}
			{isExpanded && (
				<div>

			{/* Pay Breakdown */}
			<div className='space-y-3 mb-6'>
				{/* Base Pay */}
				<div className='flex items-center justify-between'>
					<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
						Base Pay ({daysWorked} {daysWorked === 1 ? 'day' : 'days'})
					</span>
					<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-base)]'>
						£{(breakdown.basePay / 100).toFixed(2)}
					</span>
				</div>

				{/* Device Payment */}
				{breakdown.devicePayment > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-sm sm:text-lg text-[var(--finance-positive)]'>
							Device Payment ({daysWorked} {daysWorked === 1 ? 'day' : 'days'})
						</span>
						<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-positive)]'>
							+ £{(breakdown.devicePayment / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* 6-Day Bonus */}
				{breakdown.sixDayBonus > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-sm sm:text-lg text-[var(--finance-bonus)]'>
							6-Day Bonus
						</span>
						<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-bonus)]'>
							+ £{(breakdown.sixDayBonus / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* Sweeps */}
				{breakdown.sweepAdjustment !== 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
							Sweeps {<br></br>} ({breakdown.stopsGiven} you helped,{' '}
							{breakdown.stopsTaken} helped you)
						</span>
						<span
							className={`text-sm sm:text-lg font-mono font-semibold ${
								breakdown.sweepAdjustment > 0
									? 'text-[var(--finance-positive)]'
									: 'text-[var(--finance-negative)]'
							}`}
						>
							{breakdown.sweepAdjustment > 0 ? '+ ' : '- '}£
							{Math.abs(breakdown.sweepAdjustment / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* Mileage */}
				{breakdown.mileagePayment > 0 && (
					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							{isEditingMileageRate ? (
								<form
									onSubmit={handleMileageSubmit(onMileageRateSubmit)}
									className='flex items-center gap-2 flex-1'
								>
									<span className='text-[var(--text-secondary)]'>Rate:</span>
									<span className='text-[var(--text-secondary)] font-mono'>£</span>
									<Controller
										name='mileage_rate'
										control={mileageControl}
										render={({ field }) => (
											<NumberInput
												value={field.value / 10000}
												onChange={(value) => field.onChange(Math.round(value * 10000))}
												step={0.0001}
												min={0}
												max={1}
												chevronSize='sm'
												className='w-24 h-8 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] font-mono text-sm px-2'
											/>
										)}
									/>
									<span className='text-[var(--text-secondary)] text-sm'>/mi</span>
									<Button
										type='submit'
										variant='ghost'
										size='sm'
										disabled={isSavingMileageRate}
										className='text-[var(--text-success)] hover:text-[var(--finance-positive)] h-8 px-2'
									>
										<Check className='w-4 h-4' />
									</Button>
									<Button
										type='button'
										variant='ghost'
										size='sm'
										onClick={handleCancelMileageEdit}
										className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] h-8 px-2'
									>
										<X className='w-4 h-4' />
									</Button>
									{mileageErrors.mileage_rate && (
										<p className='text-[var(--input-error-text)] text-xs'>
											{mileageErrors.mileage_rate.message}
										</p>
									)}
								</form>
							) : (
								<>
									<div className='flex items-center gap-2'>
										<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
											Mileage ({breakdown.totalAmazonMiles.toFixed(1)} mi × £
											{((weekData?.mileage_rate || 1988) / 10000).toFixed(4)})
										</span>
										{weekData && (
											<Button
												variant='ghost'
												size='sm'
												onClick={handleEditMileageRate}
												className='text-yellow-500 h-5 w-5 sm:h-6 sm:w-6 p-1 sm:p-2 cursor-pointer'
											>
												<Pencil className='w-2.5 h-2.5 sm:w-3 sm:h-3' />
											</Button>
										)}
									</div>
									<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-positive)]'>
										+ £{(breakdown.mileagePayment / 100).toFixed(2)}
										{breakdown.mileageIsEstimated && (
											<span className='text-xs ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400'>
												Est
											</span>
										)}
									</span>
								</>
							)}
						</div>

						{/* Mileage Estimation Disclaimer */}
						{breakdown.mileageIsEstimated && (
							<div className='flex items-start gap-2 p-2.5 sm:p-3 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 rounded-lg'>
								<AlertCircle className='w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0' />
								<div className='text-xs text-amber-400'>
									<strong>Mileage Estimate:</strong> Payment calculated using odometer miles
									({breakdown.estimatedDaysCount} {breakdown.estimatedDaysCount === 1 ? 'day' : 'days'}).
									Actual payment may differ based on Amazon's mileage calculations and rates.
									Update with Amazon mileage data for accuracy.
								</div>
							</div>
						)}

						{/* Missing Mileage Data Warning */}
						{breakdown.hasMissingMileageData && (
							<div className='flex items-start gap-2 p-2.5 sm:p-3 bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg'>
								<AlertCircle className='w-4 h-4 text-red-400 mt-0.5 flex-shrink-0' />
								<div className='text-xs text-red-400'>
									<strong>Missing Mileage Data:</strong> No mileage entered for {breakdown.missingMileageDaysCount}
									{breakdown.missingMileageDaysCount === 1 ? ' day' : ' days'}.
									Payment total will be inaccurate until mileage is added.
								</div>
							</div>
						)}
					</div>
				)}

				{/* Van Hire */}
				{breakdown.vanDeduction > 0 && (
					<div>
						<div className='flex items-center justify-between'>
							<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
								Van Hire
							</span>
							<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-negative)]'>
								- £{(breakdown.vanDeduction / 100).toFixed(2)}
							</span>
						</div>
						{breakdown.vanBreakdown && breakdown.vanBreakdown.length > 0 && (
							<div className='ml-4 mt-1 space-y-1'>
								{breakdown.vanBreakdown
									.filter((van) => van.registration !== 'MANUAL_DEPOSIT_ADJUSTMENT')
									.map((van, idx) => (
										<div
											key={idx}
											className='flex items-center justify-between text-xs sm:text-sm text-[var(--text-tertiary)]'
										>
											<span>
												{van.registration} ({van.days} day
												{van.days !== 1 ? 's' : ''})
											</span>
											<span>- £{(van.vanCost / 100).toFixed(2)}</span>
										</div>
									))}
							</div>
						)}
					</div>
				)}

				{/* Deposit Payment */}
				{breakdown.depositPayment > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
							Deposit Payment
						</span>
						<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-negative)]'>
							- £{(breakdown.depositPayment / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* Invoicing Service */}
				{breakdown.invoicingCost > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
							Invoicing ({weekInvoicingService})
						</span>
						<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-negative)]'>
							- £{(breakdown.invoicingCost / 100).toFixed(2)}
						</span>
					</div>
				)}
			</div>

			{/* Standard Pay Total */}
			<div className='border-t border-[var(--border-primary)] pt-4 mb-6'>
				<div className='flex items-center justify-between mb-2'>
					<span className='text-lg font-semibold text-[var(--text-secondary)]'>
						Standard Pay
					</span>
					<span className='text-sm sm:text-lg font-mono font-bold text-[var(--finance-total)]'>
						£{(breakdown.standardPay / 100).toFixed(2)}
					</span>
				</div>
				<p className='text-sm sm:text-lg  text-[var(--finance-heading)]'>
					Paid Week {standardPayWeek.weekNumber} ({standardPayWeek.month})
				</p>
			</div>

			{/* Performance Bonus Section */}
			<div className='border-t border-[var(--border-primary)] pt-4'>
				{!areRankingsAvailable ? (
					// Rankings not available yet
					<div className='bg-[var(--bg-surface-secondary)] border border-[var(--border-secondary)] rounded-lg p-4'>
						<div className='flex items-center gap-2 mb-3'>
							<AlertCircle className='w-5 h-5 text-[var(--text-secondary)]' />
							<h4 className='text-lg font-semibold text-[var(--text-primary)]'>
								Performance Rankings
							</h4>
						</div>
						<p className='text-[var(--text-secondary)] text-sm'>
							Rankings will be available from{' '}
							<span className='font-semibold text-[var(--text-primary)]'>
								Week {adjustedRankingsWeek}
							</span>{' '}
							onwards.
						</p>
						<p className='text-[var(--text-tertiary)] text-xs mt-2'>
							Amazon typically releases performance rankings on Thursday of Week
							N+2 (two weeks after your work week).
						</p>
					</div>
				) : !hasBonusRankings || isEditingRankings ? (
					<form
						onSubmit={handleRankingsSubmit(onRankingsSubmit)}
						className='bg-[var(--bg-surface-secondary)] border border-[var(--border-secondary)] rounded-lg p-4'
					>
						<div className='flex items-center justify-between mb-4'>
							<div className='flex items-center gap-2'>
								<AlertCircle className='w-5 h-5 text-[var(--text-warning)]' />
								<h4 className='text-lg font-semibold text-[var(--text-primary)]'>
									Performance Rankings
								</h4>
							</div>
							{isEditingRankings && (
								<Button
									type='button'
									variant='ghost'
									size='sm'
									onClick={handleCancelRankingsEdit}
									className='text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
								>
									<X className='w-4 h-4 mr-1' />
									Cancel
								</Button>
							)}
						</div>
						<p className='text-sm text-[var(--text-secondary)] mb-4'>
							{isEditingRankings
								? 'Update your performance rankings'
								: "Enter rankings when they're released (usually Thursday after the work week)"}
						</p>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
							{/* Individual Performance */}
							<Controller
								name='individual_level'
								control={rankingsControl}
								render={({ field }) => (
									<div>
										<Label className='text-[var(--input-label)] mb-2 block'>
											Your Performance
										</Label>
										<div className='space-y-1'>
											{performanceLevels.map((level) => (
												<button
													key={level}
													type='button'
													onClick={() => field.onChange(level)}
													className={`w-full py-2 px-3 rounded-lg border text-sm transition-all ${
														field.value === level
															? 'bg-[var(--bg-route-normal)] border-[var(--border-route-normal)] text-[var(--text-route-normal)]'
															: 'bg-[var(--bg-surface-tertiary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer'
													}`}
												>
													{level}
												</button>
											))}
										</div>
										{rankingsErrors.individual_level && (
											<p className='text-[var(--input-error-text)] text-xs mt-1'>
												{rankingsErrors.individual_level.message}
											</p>
										)}
									</div>
								)}
							/>

							{/* Company Performance */}
							<Controller
								name='company_level'
								control={rankingsControl}
								render={({ field }) => (
									<div>
										<Label className='text-[var(--input-label)] mb-2 block'>
											Company Performance
										</Label>
										<div className='space-y-1'>
											{performanceLevels.map((level) => (
												<button
													key={level}
													type='button'
													onClick={() => field.onChange(level)}
													className={`w-full py-2 px-3 rounded-lg border text-sm transition-all ${
														field.value === level
															? 'bg-[var(--bg-success)] border-[var(--border-success)] text-[var(--text-success)]'
															: 'bg-[var(--bg-surface-tertiary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer'
													}`}
												>
													{level}
												</button>
											))}
										</div>
										{rankingsErrors.company_level && (
											<p className='text-[var(--input-error-text)] text-xs mt-1'>
												{rankingsErrors.company_level.message}
											</p>
										)}
									</div>
								)}
							/>
						</div>

						<Button
							type='submit'
							disabled={isSavingRankings}
							className='w-full bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)] cursor-pointer'
						>
							{isSavingRankings ? 'Saving...' : 'Save Rankings'}
						</Button>
					</form>
				) : (
					<>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm sm:text-lg text-[var(--finance-heading)]'>
								Performance Bonus ({daysWorked}{' '}
								{daysWorked === 1 ? 'day' : 'days'})
								<Button
									variant='ghost'
									size='sm'
									onClick={handleEditRankings}
									className='text-[var(--text-secondary)] h-5 w-5 sm:h-6 sm:w-6 p-1 sm:p-2 ml-1 sm:ml-2 cursor-pointer border-2 hover:text-[var(--text-mileage-van)]'
								>
									<Pencil className='w-3 h-3 sm:w-4 sm:h-4' />
								</Button>
							</span>

							<div className='flex items-center gap-2'>
								<span className='text-sm sm:text-lg font-mono font-semibold text-[var(--finance-positive)]'>
									+ £{(weekData.bonus_amount / 100).toFixed(2)}
								</span>
							</div>
						</div>
						<div className='text-sm sm:text-lg text-[var(--finance-heading)] mb-2'>
							Individual: {weekData.individual_level} | Company:{' '}
							{weekData.company_level}
						</div>
						{bonusPayWeek && (
							<p className='text-sm sm:text-lg text-[var(--finance-heading)]'>
								Paid Week {bonusPayWeek.weekNumber} ({bonusPayWeek.month})
							</p>
						)}
					</>
				)}
			</div>

			{/* Mileage Discrepancy Warning */}
			{breakdown.mileageDiscrepancy > 0 && (
				<div className='mt-6 bg-[var(--bg-warning)] border border-[var(--border-warning)] rounded-lg p-4'>
					<p className='text-[var(--text-warning)] font-medium mb-1'>Mileage Discrepancy</p>
					<p className='text-sm text-[var(--text-warning)]/80'>
						Van logged {breakdown.totalVanMiles.toFixed(1)} miles vs Amazon paid{' '}
						{breakdown.totalAmazonMiles.toFixed(1)} miles
					</p>
					<p className='text-sm text-[var(--text-warning)]/80 mt-1'>
						Estimated fuel loss: £
						{(breakdown.mileageDiscrepancyValue / 100).toFixed(2)}
					</p>
				</div>
			)}

				{/* Clear Week Button */}
				<div className='mt-6 pt-6 border-t border-[var(--border-primary)] flex justify-end'>
					<Button
						onClick={(e) => {
							e.stopPropagation()
							setShowClearConfirm(true)
						}}
						variant='ghost'
						size='sm'
						className='text-[var(--button-destructive-text)] hover:text-[var(--text-error)] hover:bg-[var(--button-destructive-hover)]'
					>
						<Trash2 className='w-4 h-4 mr-2' />
						Clear Week
					</Button>
				</div>
				</div>
			)}

			{/* Clear Week Confirmation Dialog */}
			<ConfirmationDialog
				open={showClearConfirm}
				onOpenChange={setShowClearConfirm}
				onConfirm={handleClearWeek}
				title={`Clear Week ${weekNumber}?`}
				description={
					<>
						This will permanently delete all work days, rankings, and snapshot
						data for <strong>Week {weekNumber}</strong>.
						<br />
						<br />
						This action cannot be undone.
					</>
				}
				confirmText="Clear Week"
				cancelText="Cancel"
				variant="destructive"
				icon={<Trash2 className="w-6 h-6" />}
				isLoading={isClearing}
			/>
		</div>
	)
}
