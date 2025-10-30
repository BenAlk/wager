import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { updateWeekMileageRate, updateWeekRankings } from '@/lib/api/weeks'
import {
	calculateWeeklyPayBreakdown,
	getDailyBonusRate,
} from '@/lib/calculations'
import {
	getPaymentWeekForBonus,
	getPaymentWeekForStandardPay,
} from '@/lib/dates'
import { useSettingsStore } from '@/store/settingsStore'
import { useWeeksStore } from '@/store/weeksStore'
import type { PerformanceLevel, Week } from '@/types/database'
import { AlertCircle, Check, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
	const { settings } = useSettingsStore()
	const { updateWeek } = useWeeksStore()

	const [individualLevel, setIndividualLevel] =
		useState<PerformanceLevel | null>(null)
	const [companyLevel, setCompanyLevel] = useState<PerformanceLevel | null>(
		null
	)
	const [isSavingRankings, setIsSavingRankings] = useState(false)
	const [isEditingRankings, setIsEditingRankings] = useState(false)
	const [isEditingMileageRate, setIsEditingMileageRate] = useState(false)
	const [editedMileageRate, setEditedMileageRate] = useState<number>(0)
	const [isSavingMileageRate, setIsSavingMileageRate] = useState(false)

	// Use default settings if not loaded yet
	const currentSettings = settings || {
		user_id: '',
		normal_rate: 16000,
		drs_rate: 10000,
		mileage_rate: 1988,
		invoicing_service: 'Self-Invoicing' as const,
		created_at: '',
		updated_at: '',
	}

	if (!weekData || !weekData.work_days || weekData.work_days.length === 0) {
		return (
			<div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6'>
				<h3 className='text-xl font-bold text-white mb-4'>
					Week {weekNumber} Summary
				</h3>
				<p className='text-slate-400 text-center py-8'>
					No work days logged for this week
				</p>
			</div>
		)
	}

	// Calculate pay breakdown
	const breakdown = calculateWeeklyPayBreakdown(
		weekData.work_days,
		currentSettings,
		undefined // TODO: Get active van hire from store
	)

	// Calculate payment weeks
	const standardPayWeek = getPaymentWeekForStandardPay(weekNumber, year)
	const bonusPayWeek = weekData.bonus_amount
		? getPaymentWeekForBonus(weekNumber, year)
		: null

	const daysWorked = weekData.work_days.length
	const hasBonusRankings = weekData.individual_level && weekData.company_level

	const performanceLevels: PerformanceLevel[] = [
		'Poor',
		'Fair',
		'Great',
		'Fantastic',
		'Fantastic+',
	]

	const handleSaveRankings = async () => {
		if (!user || !weekData || !individualLevel || !companyLevel) {
			toast.error('Please select both rankings')
			return
		}

		try {
			setIsSavingRankings(true)

			// Calculate bonus amount
			const dailyBonus = getDailyBonusRate(individualLevel, companyLevel)
			const bonusAmount = dailyBonus * daysWorked

			// Update in database
			await updateWeekRankings(
				weekData.id,
				individualLevel,
				companyLevel,
				bonusAmount
			)

			// Update cache
			updateWeek(weekData.id, {
				individual_level: individualLevel,
				company_level: companyLevel,
				bonus_amount: bonusAmount,
			})

			toast.success('Rankings saved successfully!')
			setIsEditingRankings(false)
		} catch (error) {
			console.error('Error saving rankings:', error)
			toast.error('Failed to save rankings')
		} finally {
			setIsSavingRankings(false)
		}
	}

	const handleEditRankings = () => {
		// Pre-populate with existing values
		setIndividualLevel(weekData?.individual_level || null)
		setCompanyLevel(weekData?.company_level || null)
		setIsEditingRankings(true)
	}

	const handleCancelEdit = () => {
		setIndividualLevel(null)
		setCompanyLevel(null)
		setIsEditingRankings(false)
	}

	const handleEditMileageRate = () => {
		setEditedMileageRate(weekData?.mileage_rate || currentSettings.mileage_rate)
		setIsEditingMileageRate(true)
	}

	const handleSaveMileageRate = async () => {
		if (!weekData || !user) return

		try {
			setIsSavingMileageRate(true)
			await updateWeekMileageRate(weekData.id, editedMileageRate)
			updateWeek(weekData.id, { mileage_rate: editedMileageRate })
			toast.success('Mileage rate updated!')
			setIsEditingMileageRate(false)
		} catch (error) {
			console.error('Error updating mileage rate:', error)
			toast.error('Failed to update mileage rate')
		} finally {
			setIsSavingMileageRate(false)
		}
	}

	const handleCancelMileageEdit = () => {
		setIsEditingMileageRate(false)
	}

	return (
		<div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8'>
			<h3 className='text-2xl font-bold text-white mb-6'>
				Week {weekNumber} Summary
			</h3>

			{/* Pay Breakdown */}
			<div className='space-y-3 mb-6'>
				{/* Base Pay */}
				<div className='flex items-center justify-between'>
					<span className='text-slate-400'>
						Base Pay ({daysWorked} {daysWorked === 1 ? 'day' : 'days'})
					</span>
					<span className='font-mono font-semibold text-white'>
						£{(breakdown.basePay / 100).toFixed(2)}
					</span>
				</div>

				{/* 6-Day Bonus */}
				{breakdown.sixDayBonus > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-emerald-400'>6-Day Bonus</span>
						<span className='font-mono font-semibold text-emerald-400'>
							+ £{(breakdown.sixDayBonus / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* Sweeps */}
				{breakdown.sweepAdjustment !== 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-slate-400'>
							Sweeps ({breakdown.stopsGiven} you helped, {breakdown.stopsTaken}{' '}
							helped you)
						</span>
						<span
							className={`font-mono font-semibold ${
								breakdown.sweepAdjustment > 0
									? 'text-emerald-400'
									: 'text-red-400'
							}`}
						>
							{breakdown.sweepAdjustment > 0 ? '+ ' : '- '}£
							{Math.abs(breakdown.sweepAdjustment / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* Mileage */}
				{breakdown.mileagePayment > 0 && (
					<div className='flex items-center justify-between'>
						{isEditingMileageRate ? (
							<div className='flex items-center gap-2 flex-1'>
								<span className='text-slate-400'>Rate:</span>
								<span className='text-slate-400 font-mono'>£</span>
								<Input
									type='number'
									step='0.0001'
									value={(editedMileageRate / 10000).toFixed(4)}
									onChange={(e) => {
										const pounds = parseFloat(e.target.value) || 0
										setEditedMileageRate(Math.round(pounds * 10000))
									}}
									className='w-24 h-8 bg-white/5 border-white/10 text-white font-mono text-sm px-2'
								/>
								<span className='text-slate-400 text-sm'>/mi</span>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleSaveMileageRate}
									disabled={isSavingMileageRate}
									className='text-emerald-400 hover:text-emerald-300 h-8 px-2'
								>
									<Check className='w-4 h-4' />
								</Button>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleCancelMileageEdit}
									className='text-slate-400 hover:text-white h-8 px-2'
								>
									<X className='w-4 h-4' />
								</Button>
							</div>
						) : (
							<>
								<div className='flex items-center gap-2'>
									<span className='text-slate-400'>
										Mileage ({breakdown.totalAmazonMiles.toFixed(1)} mi × £
										{(
											(weekData?.mileage_rate || currentSettings.mileage_rate) /
											10000
										).toFixed(4)}
										)
									</span>
									{weekData && (
										<Button
											variant='ghost'
											size='sm'
											onClick={handleEditMileageRate}
											className='text-slate-400 hover:text-white h-6 w-6 p-0 cursor-pointer'
										>
											<Pencil className='w-3 h-3' />
										</Button>
									)}
								</div>
								<span className='font-mono font-semibold text-emerald-400'>
									+ £{(breakdown.mileagePayment / 100).toFixed(2)}
								</span>
							</>
						)}
					</div>
				)}

				{/* Van Hire */}
				{breakdown.vanDeduction > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-slate-400'>Van Hire</span>
						<span className='font-mono font-semibold text-red-400'>
							- £{(breakdown.vanDeduction / 100).toFixed(2)}
						</span>
					</div>
				)}

				{/* Invoicing Service */}
				{breakdown.invoicingCost > 0 && (
					<div className='flex items-center justify-between'>
						<span className='text-slate-400'>
							Invoicing ({currentSettings.invoicing_service})
						</span>
						<span className='font-mono font-semibold text-red-400'>
							- £{(breakdown.invoicingCost / 100).toFixed(2)}
						</span>
					</div>
				)}
			</div>

			{/* Standard Pay Total */}
			<div className='border-t border-white/20 pt-4 mb-6'>
				<div className='flex items-center justify-between mb-2'>
					<span className='text-lg font-semibold text-slate-200'>
						Standard Pay
					</span>
					<span className='text-2xl font-mono font-bold text-white'>
						£{(breakdown.standardPay / 100).toFixed(2)}
					</span>
				</div>
				<p className='text-sm text-slate-400'>
					Paid Week {standardPayWeek.weekNumber} ({standardPayWeek.month})
				</p>
			</div>

			{/* Performance Bonus Section */}
			<div className='border-t border-white/20 pt-4'>
				{!hasBonusRankings || isEditingRankings ? (
					<div className='bg-white/5 border border-white/10 rounded-lg p-4'>
						<div className='flex items-center justify-between mb-4'>
							<div className='flex items-center gap-2'>
								<AlertCircle className='w-5 h-5 text-amber-400' />
								<h4 className='text-lg font-semibold text-white'>
									Performance Rankings
								</h4>
							</div>
							{isEditingRankings && (
								<Button
									variant='ghost'
									size='sm'
									onClick={handleCancelEdit}
									className='text-slate-400 hover:text-white'
								>
									<X className='w-4 h-4 mr-1' />
									Cancel
								</Button>
							)}
						</div>
						<p className='text-sm text-slate-400 mb-4'>
							{isEditingRankings
								? 'Update your performance rankings'
								: "Enter rankings when they're released (usually Thursday after the work week)"}
						</p>

						<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
							{/* Individual Performance */}
							<div>
								<Label className='text-slate-200 mb-2 block'>
									Your Performance
								</Label>
								<div className='space-y-1'>
									{performanceLevels.map((level) => (
										<button
											key={level}
											type='button'
											onClick={() => setIndividualLevel(level)}
											className={`w-full py-2 px-3 rounded-lg border text-sm transition-all ${
												individualLevel === level
													? 'bg-blue-500/20 border-blue-500 text-blue-400'
													: 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 cursor-pointer'
											}`}
										>
											{level}
										</button>
									))}
								</div>
							</div>

							{/* Company Performance */}
							<div>
								<Label className='text-slate-200 mb-2 block'>
									Company Performance
								</Label>
								<div className='space-y-1'>
									{performanceLevels.map((level) => (
										<button
											key={level}
											type='button'
											onClick={() => setCompanyLevel(level)}
											className={`w-full py-2 px-3 rounded-lg border text-sm transition-all ${
												companyLevel === level
													? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
													: 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 cursor-pointer'
											}`}
										>
											{level}
										</button>
									))}
								</div>
							</div>
						</div>

						<Button
							onClick={handleSaveRankings}
							disabled={!individualLevel || !companyLevel || isSavingRankings}
							className='w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white cursor-pointer'
						>
							{isSavingRankings ? 'Saving...' : 'Save Rankings'}
						</Button>
					</div>
				) : (
					<>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-slate-400'>
								Performance Bonus ({daysWorked}{' '}
								{daysWorked === 1 ? 'day' : 'days'})
							</span>
							<div className='flex items-center gap-2'>
								<span className='font-mono font-semibold text-emerald-400'>
									+ £{(weekData.bonus_amount / 100).toFixed(2)}
								</span>
								<Button
									variant='ghost'
									size='sm'
									onClick={handleEditRankings}
									className='text-slate-400 hover:text-white -mr-2 cursor-pointer'
								>
									<Pencil className='w-4 h-4' />
								</Button>
							</div>
						</div>
						<div className='text-sm text-slate-400 mb-2'>
							Individual: {weekData.individual_level} | Company:{' '}
							{weekData.company_level}
						</div>
						{bonusPayWeek && (
							<p className='text-sm text-slate-400'>
								Paid Week {bonusPayWeek.weekNumber} ({bonusPayWeek.month})
							</p>
						)}
					</>
				)}
			</div>

			{/* Total Expected */}
			<div className='border-t border-white/20 pt-4 mt-6'>
				<div className='flex items-center justify-between'>
					<span className='text-xl font-bold text-white'>Total Earnings</span>
					<span className='text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400'>
						£
						{(
							(breakdown.standardPay + (weekData.bonus_amount || 0)) /
							100
						).toFixed(2)}
					</span>
				</div>
			</div>

			{/* Mileage Discrepancy Warning */}
			{breakdown.mileageDiscrepancy > 0 && (
				<div className='mt-6 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4'>
					<p className='text-amber-400 font-medium mb-1'>Mileage Discrepancy</p>
					<p className='text-sm text-amber-400/80'>
						Van logged {breakdown.totalVanMiles.toFixed(1)} miles vs Amazon paid{' '}
						{breakdown.totalAmazonMiles.toFixed(1)} miles
					</p>
					<p className='text-sm text-amber-400/80 mt-1'>
						Estimated fuel loss: £
						{(breakdown.mileageDiscrepancyValue / 100).toFixed(2)}
					</p>
				</div>
			)}
		</div>
	)
}
