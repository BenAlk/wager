import { calculateWeeklyPayBreakdown } from '@/lib/calculations'
import { getPreviousWeek } from '@/lib/dates'
import type { Week } from '@/types/database'
import { AlertCircle, Banknote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PaymentThisWeekProps {
	weekNumber: number
	year: number
	weekNMinus2Data: Week | undefined // Week N-2 for standard pay
	weekNMinus6Data: Week | undefined // Week N-6 for bonus
}

export default function PaymentThisWeek({
	weekNumber,
	year,
	weekNMinus2Data,
	weekNMinus6Data,
}: PaymentThisWeekProps) {
	const navigate = useNavigate()

	// Calculate Week N-2 standard pay
	const standardPayBreakdown =
		weekNMinus2Data &&
		weekNMinus2Data.work_days &&
		weekNMinus2Data.work_days.length > 0
			? calculateWeeklyPayBreakdown(
					weekNMinus2Data.work_days,
					weekNMinus2Data.invoicing_service || 'Self-Invoicing',
					undefined // Van hire would be passed here if needed
			  )
			: null

	// Get Week N-6 bonus
	const bonusPayment = weekNMinus6Data?.bonus_amount || 0

	// Calculate total payment this week
	const totalPayment = (standardPayBreakdown?.standardPay || 0) + bonusPayment

	// Calculate what weeks the payments are from
	const weekNMinus2Info = getPreviousWeek(weekNumber, year, 2)
	const weekNMinus6Info = getPreviousWeek(weekNumber, year, 6)

	// Check if Week N-6 has work days but no rankings entered
	const hasWeekNMinus6WorkDays =
		weekNMinus6Data &&
		weekNMinus6Data.work_days &&
		weekNMinus6Data.work_days.length > 0
	const hasWeekNMinus6Rankings =
		weekNMinus6Data?.individual_level && weekNMinus6Data?.company_level

	const shouldShowRankingsReminder =
		hasWeekNMinus6WorkDays && !hasWeekNMinus6Rankings

	// Handler to navigate to Week N-6
	const handleNavigateToWeekNMinus6 = () => {
		navigate(`/calendar?week=${weekNMinus6Info.week}&year=${weekNMinus6Info.year}`)
	}

	// If no payments this week, show a message
	if (totalPayment === 0) {
		return (
			<div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8'>
				<div className='flex items-center gap-3 mb-4'>
					<div className='w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center'>
						<Banknote className='w-6 h-6 text-blue-400' />
					</div>
					<h3 className='text-xl font-bold text-white'>Payment This Week</h3>
				</div>
				<p className='text-slate-400 text-center py-4'>
					No payment expected this week
				</p>
			</div>
		)
	}

	return (
		<div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8'>
			<div className='flex items-center justify-center gap-3 mb-6'>
				<div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center'>
					<Banknote className='w-6 h-6 text-white' />
				</div>
				<h3 className='text-xl sm:text-2xl font-bold text-white'>
					Payment This Week
				</h3>
			</div>

			<div className='space-y-3 mb-6'>
				{/* Standard Pay from Week N-2 */}
				{standardPayBreakdown && standardPayBreakdown.standardPay > 0 && (
					<div className='bg-white/5 border border-white/10 rounded-lg p-4'>
						<div className='text-xs text-slate-500 space-y-1'>
							<div className='flex justify-between'>
								<span className='text-sm sm:text-lg'>Base Pay</span>
								<span className='text-sm sm:text-lg text-emerald-400'>
									+£{(standardPayBreakdown.basePay / 100).toFixed(2)}
								</span>
							</div>
							{standardPayBreakdown.sixDayBonus > 0 && (
								<div className='flex justify-between'>
									<span className='text-sm sm:text-lg'>6-Day Bonus</span>
									<span className='text-sm sm:text-lg text-emerald-400'>
										+£{(standardPayBreakdown.sixDayBonus / 100).toFixed(2)}
									</span>
								</div>
							)}
							{standardPayBreakdown.sweepAdjustment !== 0 && (
								<div className='text-sm sm:text-lg flex justify-between'>
									<span>Sweeps</span>
									<span
										className={
											standardPayBreakdown.sweepAdjustment > 0
												? 'text-emerald-400'
												: 'text-red-400'
										}
									>
										{standardPayBreakdown.sweepAdjustment > 0 ? '+' : ''}£
										{(standardPayBreakdown.sweepAdjustment / 100).toFixed(2)}
									</span>
								</div>
							)}
							{standardPayBreakdown.mileagePayment > 0 && (
								<div className='text-sm sm:text-lg flex justify-between'>
									<span>Mileage</span>
									<span className='text-emerald-400'>
										+£{(standardPayBreakdown.mileagePayment / 100).toFixed(2)}
									</span>
								</div>
							)}
							{standardPayBreakdown.vanDeduction > 0 && (
								<div className='text-sm sm:text-lg flex justify-between'>
									<span>Van Hire</span>
									<span className='text-red-400'>
										-£{(standardPayBreakdown.vanDeduction / 100).toFixed(2)}
									</span>
								</div>
							)}
							{standardPayBreakdown.invoicingCost > 0 && (
								<div className='text-sm sm:text-lg flex justify-between'>
									<span>Invoicing</span>
									<span className='text-red-400'>
										-£{(standardPayBreakdown.invoicingCost / 100).toFixed(2)}
									</span>
								</div>
							)}
							<div className='flex items-center justify-between mb-2'>
								<span className='text-sm sm:text-xs lg:text-lg text-slate-400'>
									Standard Pay (Week {weekNMinus2Info.week})
								</span>
								<span className='text-lg sm:text-xl lg:text-2xl font-mono font-bold text-white'>
									£{(standardPayBreakdown.standardPay / 100).toFixed(2)}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Performance Bonus from Week N-6 */}
				{bonusPayment > 0 && (
					<div className='bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<span className='text-xs md:text-xl text-slate-400 block'>
									Performance Bonus (Week {weekNMinus6Info.week})
								</span>
								{weekNMinus6Data && (
									<span className='text-xs text-emerald-400/80'>
										{weekNMinus6Data.individual_level} /{' '}
										{weekNMinus6Data.company_level}
									</span>
								)}
							</div>
							<span className='sm:text-sm lg:text-2xl font-mono font-bold text-emerald-400'>
								+£{(bonusPayment / 100).toFixed(2)}
							</span>
						</div>
					</div>
				)}

				{/* Reminder for missing Week N-6 rankings */}
				{shouldShowRankingsReminder && (
					<div
						onClick={handleNavigateToWeekNMinus6}
						className='bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 cursor-pointer hover:bg-amber-500/15 transition-colors'
					>
						<div className='flex items-start gap-3'>
							<AlertCircle className='w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5' />
							<div className='flex-1'>
								<p className='text-amber-400 font-medium text-sm sm:text-base'>
									Missing Performance Rankings
								</p>
								<p className='text-amber-400/80 text-xs sm:text-sm mt-1'>
									Week {weekNMinus6Info.week} rankings haven't been entered yet.
									Click here to add them and estimate your bonus payment.
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Total Payment */}
			<div className='border-t border-white/20 pt-6'>
				<div className='flex items-center justify-between'>
					<span className='text-xs sm:text-2xl font-bold text-white'>
						Total Payment (Week {weekNumber})
					</span>
					<span className='text-lg sm:text-4xl font-mono font-bold text-emerald-400 animate-pulse'>
						£{(totalPayment / 100).toFixed(2)}
					</span>
				</div>
				<p className='text-xs text-slate-500 mt-2 text-center sm:text-right'>
					Expected in your bank account this week
				</p>
			</div>
		</div>
	)
}
