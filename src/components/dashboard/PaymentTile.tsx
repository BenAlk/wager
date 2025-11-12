import { useEffect, useState } from 'react'
import { Banknote } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { fetchWeekWithWorkDays } from '@/lib/api/weeks'
import { fetchVanHiresForWeek } from '@/lib/api/vans'
import { calculateWeeklyPayBreakdown } from '@/lib/calculations'
import { getPreviousWeek, getWeekDateRange, dateToWeekNumber } from '@/lib/dates'
import { useVanStore } from '@/store/vanStore'

import { DashboardTile } from './DashboardTile'

export function PaymentTile() {
	const { user } = useAuth()
	const { allVans } = useVanStore()
	const [totalPayment, setTotalPayment] = useState<number>(0)
	const [loading, setLoading] = useState(true)

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
				const standardPayBreakdown =
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
				const bonusPayment = weekNMinus6Data?.week.bonus_amount || 0

				// Calculate total
				const total = (standardPayBreakdown?.standardPay || 0) + bonusPayment
				setTotalPayment(total)
			} catch (error) {
				console.error('Error fetching payment data:', error)
			} finally {
				setLoading(false)
			}
		}

		fetchPaymentData()
	}, [user?.id, currentWeek, currentYear])

	return (
		<DashboardTile title='Payment This Week' icon={Banknote}>
			{loading ? (
				<div className='text-center py-8'>
					<div className='text-[var(--text-secondary)]'>Loading...</div>
				</div>
			) : (
				<div className='text-center py-4'>
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
				</div>
			)}
		</DashboardTile>
	)
}
