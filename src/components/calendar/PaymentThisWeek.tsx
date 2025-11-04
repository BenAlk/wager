import { calculateWeeklyPayBreakdown } from '@/lib/calculations'
import { getPreviousWeek, getWeekDateRange } from '@/lib/dates'
import type { Week, VanHire } from '@/types/database'
import { AlertCircle, Banknote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchVanHiresForWeek } from '@/lib/api/vans'
import { useAuth } from '@/hooks/useAuth'
import { useVanStore } from '@/store/vanStore'

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
	const { user } = useAuth()
	const { allVans } = useVanStore()
	const [weekNMinus2VanHires, setWeekNMinus2VanHires] = useState<VanHire[]>([])

	// Calculate what weeks the payments are from
	const weekNMinus2Info = getPreviousWeek(weekNumber, year, 2)
	const weekNMinus6Info = getPreviousWeek(weekNumber, year, 6)

	// Fetch vans active during Week N-2
	useEffect(() => {
		const fetchVansForWeekNMinus2 = async () => {
			if (!user?.id) return

			const { startDate, endDate } = getWeekDateRange(weekNMinus2Info.week, weekNMinus2Info.year)
			const vans = await fetchVanHiresForWeek(user.id, startDate, endDate)
			setWeekNMinus2VanHires(vans)
		}

		fetchVansForWeekNMinus2()
	}, [user?.id, weekNMinus2Info.week, weekNMinus2Info.year])

	// Calculate deposit payment for Week N-2
	// Any week with a van triggers a deposit payment in Week N+2 (this week)
	// Count how many weeks had a van BEFORE Week N-2 to determine which week this is
	const { startDate: weekNMinus2Start, endDate: weekNMinus2End } = getWeekDateRange(weekNMinus2Info.week, weekNMinus2Info.year)

	// Total deposit already paid (from all previous weeks before Week N-2)
	const depositPaidBeforeWeekNMinus2 = allVans
		.filter((van) => new Date(van.on_hire_date) < weekNMinus2Start)
		.reduce((sum, van) => sum + van.deposit_paid, 0)

	// Count how many weeks had ANY van before Week N-2 ended
	// This determines if this is the 1st, 2nd, 3rd, etc. week with a van
	const earliestVanHire = allVans.length > 0
		? allVans.reduce((earliest, van) =>
				new Date(van.on_hire_date) < new Date(earliest.on_hire_date) ? van : earliest
		  )
		: null

	let weeksWithVanBeforeNMinus2 = 0
	if (earliestVanHire) {
		const firstVanStart = new Date(earliestVanHire.on_hire_date)
		if (firstVanStart < weekNMinus2Start) {
			// Calculate weeks from first van hire to start of Week N-2
			const daysSinceFirstVan = Math.ceil(
				(weekNMinus2Start.getTime() - firstVanStart.getTime()) / (1000 * 60 * 60 * 24)
			)
			weeksWithVanBeforeNMinus2 = Math.ceil(daysSinceFirstVan / 7)
		}
	}

	// If Week N-2 has a van, this is week number (weeksWithVanBeforeNMinus2 + 1)
	// This determines the deposit amount: weeks 1-2 = £25, weeks 3+ = £50
	const weekNumberWithVan = weekNMinus2VanHires.length > 0 ? weeksWithVanBeforeNMinus2 + 1 : 0

	// Calculate Week N-2 standard pay with van costs
	const standardPayBreakdown =
		weekNMinus2Data &&
		weekNMinus2Data.work_days &&
		weekNMinus2Data.work_days.length > 0
			? calculateWeeklyPayBreakdown(
					weekNMinus2Data.work_days,
					weekNMinus2Data.invoicing_service || 'Self-Invoicing',
					weekNMinus2VanHires,
					weekNMinus2Start,
					weekNMinus2End,
					depositPaidBeforeWeekNMinus2,
					weekNumberWithVan
			  )
			: null

	// Get Week N-6 bonus
	const bonusPayment = weekNMinus6Data?.bonus_amount || 0

	// Calculate total payment this week
	const totalPayment = (standardPayBreakdown?.standardPay || 0) + bonusPayment

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
							{standardPayBreakdown.depositPayment > 0 && (
								<div className='text-sm sm:text-lg flex justify-between'>
									<span>Deposit Payment</span>
									<span className='text-red-400'>
										-£{(standardPayBreakdown.depositPayment / 100).toFixed(2)}
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
