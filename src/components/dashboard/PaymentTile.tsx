import { useEffect, useState } from 'react'
import { Banknote, X } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { fetchWeekWithWorkDays } from '@/lib/api/weeks'
import { fetchVanHiresForWeek } from '@/lib/api/vans'
import { calculateWeeklyPayBreakdown, type WeeklyPayBreakdownSimple } from '@/lib/calculations'
import { getPreviousWeek, getWeekDateRange, dateToWeekNumber } from '@/lib/dates'
import { useVanStore } from '@/store/vanStore'

import { DashboardTile } from './DashboardTile'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function PaymentTile() {
	const { user } = useAuth()
	const { allVans } = useVanStore()
	const [totalPayment, setTotalPayment] = useState<number>(0)
	const [standardPayBreakdown, setStandardPayBreakdown] = useState<WeeklyPayBreakdownSimple | null>(null)
	const [bonusPayment, setBonusPayment] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)

	const today = new Date()
	const { week: currentWeek, year: currentYear } = dateToWeekNumber(today)

	// Calculate what weeks the payments are from
	const weekNMinus2Info = getPreviousWeek(currentWeek, currentYear, 2)
	const weekNMinus6Info = getPreviousWeek(currentWeek, currentYear, 6)

	useEffect(() => {
		const fetchPaymentData = async () => {
			if (!user?.id) return

			setLoading(true)
			try {
				// Fetch Week N-2 for standard pay
				const weekNMinus2Data = await fetchWeekWithWorkDays(
					user.id,
					weekNMinus2Info.week,
					weekNMinus2Info.year
				)

				// Fetch Week N-6 for bonus
				const weekNMinus6Data = await fetchWeekWithWorkDays(
					user.id,
					weekNMinus6Info.week,
					weekNMinus6Info.year
				)

				// Fetch vans for Week N-2
				const { startDate: weekNMinus2Start, endDate: weekNMinus2End } =
					getWeekDateRange(weekNMinus2Info.week, weekNMinus2Info.year)

				const weekNMinus2VanHires = await fetchVanHiresForWeek(
					user.id,
					weekNMinus2Start,
					weekNMinus2End
				)

				// Calculate deposit payment
				const depositPaidBeforeWeekNMinus2 = allVans
					.filter((van) => new Date(van.on_hire_date) < weekNMinus2Start)
					.reduce((sum, van) => sum + van.deposit_paid, 0)

				const earliestVanHire =
					allVans.length > 0
						? allVans.reduce((earliest, van) =>
								new Date(van.on_hire_date) < new Date(earliest.on_hire_date)
									? van
									: earliest
						  )
						: null

				let weeksWithVanBeforeNMinus2 = 0
				if (earliestVanHire) {
					const firstVanStart = new Date(earliestVanHire.on_hire_date)
					if (firstVanStart < weekNMinus2Start) {
						const daysSinceFirstVan = Math.ceil(
							(weekNMinus2Start.getTime() - firstVanStart.getTime()) /
								(1000 * 60 * 60 * 24)
						)
						weeksWithVanBeforeNMinus2 = Math.ceil(daysSinceFirstVan / 7)
					}
				}

				const weekNumberWithVan =
					weekNMinus2VanHires.length > 0 ? weeksWithVanBeforeNMinus2 + 1 : 0

				// Calculate standard pay
				const breakdown =
					weekNMinus2Data &&
					weekNMinus2Data.workDays &&
					weekNMinus2Data.workDays.length > 0
						? calculateWeeklyPayBreakdown(
								weekNMinus2Data.workDays,
								weekNMinus2Data.week.invoicing_service || 'Self-Invoicing',
								weekNMinus2VanHires,
								weekNMinus2Start,
								weekNMinus2End,
								depositPaidBeforeWeekNMinus2,
								weekNumberWithVan
						  )
						: null

				// Get bonus payment
				const bonus = weekNMinus6Data?.week.bonus_amount || 0

				// Calculate total
				const total = (breakdown?.standardPay || 0) + bonus
				setTotalPayment(total)
				setStandardPayBreakdown(breakdown)
				setBonusPayment(bonus)
			} catch (error) {
				console.error('Error fetching payment data:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchPaymentData()
	}, [user?.id, currentWeek, currentYear, allVans, weekNMinus2Info.week, weekNMinus2Info.year, weekNMinus6Info.week, weekNMinus6Info.year])

	const hasPaymentData = standardPayBreakdown || bonusPayment > 0

	return (
		<>
			<DashboardTile title='Payment This Week' icon={Banknote} data-tour='payment-tile'>
				{loading ? (
					<div className='text-center py-8'>
						<div className='text-[var(--text-secondary)]'>Loading...</div>
					</div>
				) : (
					<button
						type='button'
						className={`w-full text-center py-4 bg-transparent border-0 font-inherit ${hasPaymentData ? 'cursor-pointer hover:bg-[var(--bg-hover)] rounded-lg transition-colors' : 'cursor-default'}`}
						onClick={() => hasPaymentData && setShowModal(true)}
						disabled={!hasPaymentData}
						aria-label={hasPaymentData ? 'View payment breakdown' : undefined}
					>
						<div className='text-sm text-[var(--text-secondary)] mb-2'>
							Expected in your account
						</div>
						<div
							className={
								'text-4xl font-mono font-bold ' +
								(totalPayment < 0 ? 'text-[var(--finance-negative)]' : 'text-[var(--finance-positive)]')
							}
						>
							£{(totalPayment / 100).toFixed(2)}
						</div>
						<div className='text-xs text-[var(--text-tertiary)] mt-2'>
							Week {currentWeek}, {currentYear}
						</div>
						{hasPaymentData && (
							<div className='text-xs text-[var(--text-secondary)] mt-2'>
								Tap for breakdown
							</div>
						)}
					</button>
				)}
			</DashboardTile>

			{/* Payment Breakdown Modal */}
			{showModal && hasPaymentData && (
				<div className='fixed inset-0 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4'>
					<Card className='bg-[var(--modal-bg)] border-[var(--modal-border)] max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto'>
						<div className='flex items-center justify-between mb-6'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] rounded-lg flex items-center justify-center'>
									<Banknote className='w-6 h-6 text-[var(--text-primary)]' />
								</div>
								<h3 className='text-xl font-bold text-[var(--text-primary)]'>
									Payment Breakdown
								</h3>
							</div>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setShowModal(false)}
								className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
								aria-label='Close payment breakdown'
							>
								<X className='w-5 h-5' aria-hidden='true' />
							</Button>
						</div>

						<div className='space-y-4'>
							{/* Standard Pay from Week N-2 */}
							{standardPayBreakdown && (
								<div className='bg-[var(--bg-surface-secondary)] border border-[var(--border-secondary)] rounded-lg p-4'>
									<div className='text-sm text-[var(--text-secondary)] mb-3'>
										Standard Pay (Week {weekNMinus2Info.week})
									</div>
									<div className='space-y-2'>
										<div className='flex justify-between'>
											<span className='text-[var(--text-primary)]'>Base Pay</span>
											<span className='font-mono text-[var(--finance-positive)]'>
												+£{(standardPayBreakdown.basePay / 100).toFixed(2)}
											</span>
										</div>
										{standardPayBreakdown.sixDayBonus > 0 && (
											<div className='flex justify-between'>
												<span className='text-[var(--text-primary)]'>6-Day Bonus</span>
												<span className='font-mono text-[var(--finance-positive)]'>
													+£{(standardPayBreakdown.sixDayBonus / 100).toFixed(2)}
												</span>
											</div>
										)}
										{standardPayBreakdown.sweepAdjustment !== 0 && (
											<div className='flex justify-between'>
												<span className='text-[var(--text-primary)]'>Sweeps</span>
												<span
													className={
														'font-mono ' +
														(standardPayBreakdown.sweepAdjustment > 0
															? 'text-[var(--finance-positive)]'
															: 'text-[var(--finance-negative)]')
													}
												>
													{standardPayBreakdown.sweepAdjustment > 0 ? '+' : ''}£
													{(standardPayBreakdown.sweepAdjustment / 100).toFixed(2)}
												</span>
											</div>
										)}
										{standardPayBreakdown.mileagePayment > 0 && (
											<div className='flex justify-between'>
												<span className='text-[var(--text-primary)]'>Mileage</span>
												<span className='font-mono text-[var(--finance-positive)]'>
													+£{(standardPayBreakdown.mileagePayment / 100).toFixed(2)}
												</span>
											</div>
										)}
										{standardPayBreakdown.vanDeduction > 0 && (
											<div className='flex justify-between'>
												<span className='text-[var(--text-primary)]'>Van Hire</span>
												<span className='font-mono text-[var(--finance-negative)]'>
													-£{(standardPayBreakdown.vanDeduction / 100).toFixed(2)}
												</span>
											</div>
										)}
										{standardPayBreakdown.depositPayment > 0 && (
											<div className='flex justify-between'>
												<span className='text-[var(--text-primary)]'>Deposit Payment</span>
												<span className='font-mono text-[var(--finance-negative)]'>
													-£{(standardPayBreakdown.depositPayment / 100).toFixed(2)}
												</span>
											</div>
										)}
										{standardPayBreakdown.invoicingCost > 0 && (
											<div className='flex justify-between'>
												<span className='text-[var(--text-primary)]'>Invoicing</span>
												<span className='font-mono text-[var(--finance-negative)]'>
													-£{(standardPayBreakdown.invoicingCost / 100).toFixed(2)}
												</span>
											</div>
										)}
										<div className='flex justify-between pt-2 border-t border-[var(--border-secondary)]'>
											<span className='font-semibold text-[var(--text-primary)]'>Subtotal</span>
											<span className='font-mono font-bold text-[var(--text-primary)]'>
												£{(standardPayBreakdown.standardPay / 100).toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Performance Bonus from Week N-6 */}
							{bonusPayment > 0 && (
								<div className='bg-[var(--bg-success)] border border-[var(--border-success)] rounded-lg p-4'>
									<div className='text-sm text-[var(--text-secondary)] mb-2'>
										Performance Bonus (Week {weekNMinus6Info.week})
									</div>
									<div className='flex justify-between'>
										<span className='font-semibold text-[var(--text-primary)]'>Bonus</span>
										<span className='font-mono font-bold text-[var(--finance-positive)]'>
											+£{(bonusPayment / 100).toFixed(2)}
										</span>
									</div>
								</div>
							)}

							{/* Total Payment */}
							<div className='border-t border-[var(--border-primary)] pt-4'>
								<div className='flex justify-between items-center'>
									<span className='text-lg font-bold text-[var(--text-primary)]'>
										Total Payment
									</span>
									<span
										className={
											'text-2xl font-mono font-bold ' +
											(totalPayment < 0
												? 'text-[var(--finance-negative)]'
												: 'text-[var(--finance-positive)]')
										}
									>
										£{(totalPayment / 100).toFixed(2)}
									</span>
								</div>
								<p className='text-xs text-[var(--text-tertiary)] mt-2 text-right'>
									Expected in Week {currentWeek}, {currentYear}
								</p>
							</div>
						</div>
					</Card>
				</div>
			)}
		</>
	)
}
