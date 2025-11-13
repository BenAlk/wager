import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

import { fetchWeekWithWorkDays } from '@/lib/api/weeks'
import { dateToWeekNumber } from '@/lib/dates'

import { QuickAddWorkTile } from '@/components/dashboard/QuickAddWorkTile'
import { PaymentTile } from '@/components/dashboard/PaymentTile'
import { QuickAddSweepsTile } from '@/components/dashboard/QuickAddSweepsTile'
import { RankingsReminderTile } from '@/components/dashboard/RankingsReminderTile'
import { QuickAddOdometerTile } from '@/components/dashboard/QuickAddOdometerTile'
import { VanStatusTile } from '@/components/dashboard/VanStatusTile'
import { LoadingScreen } from '@/components/shared/LoadingScreen'

export default function Dashboard() {
	const { user, loading } = useAuth()
	const [hasWorkToday, setHasWorkToday] = useState(false)

	// Check if work exists for today
	const checkTodayWorkStatus = async () => {
		if (!user?.id) return

		const today = new Date()
		const todayString = today.toISOString().split('T')[0]
		const { week, year } = dateToWeekNumber(today)

		const weekData = await fetchWeekWithWorkDays(user.id, week, year)
		const todayWork = weekData?.workDays?.find((wd) => wd.date === todayString)
		setHasWorkToday(!!todayWork)
	}

	useEffect(() => {
		checkTodayWorkStatus()
	}, [user?.id])

	if (loading) {
		return <LoadingScreen />
	}

	return (
		<div className='p-4 md:p-8'>
			<div className='max-w-7xl mx-auto'>
				<h1 className='sr-only'>Dashboard</h1>
				{/* Dashboard Grid */}
				<main aria-label='Dashboard tiles' className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Quick Add Work - Mobile: 1st, Desktop: Top-left */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.1 }}
						className='order-1'
					>
						<QuickAddWorkTile
							onWorkAdded={() => {
								setHasWorkToday(true)
							}}
						/>
					</motion.div>

					{/* Quick Add Sweeps - Mobile: 2nd, Desktop: Middle-left */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.2 }}
						className='order-2 md:order-3'
					>
						<QuickAddSweepsTile hasWorkToday={hasWorkToday} />
					</motion.div>

					{/* Quick Add Odometer - Mobile: 3rd, Desktop: Bottom-left */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.3 }}
						className='order-3 md:order-5'
					>
						<QuickAddOdometerTile hasWorkToday={hasWorkToday} />
					</motion.div>

					{/* Payment This Week - Mobile: 4th, Desktop: Top-right */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.15 }}
						className='order-4 md:order-2'
					>
						<PaymentTile />
					</motion.div>

					{/* Rankings Reminder - Mobile: 5th, Desktop: Middle-right */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.25 }}
						className='order-5 md:order-4'
					>
						<RankingsReminderTile />
					</motion.div>

					{/* Van Status - Mobile: 6th, Desktop: Bottom-right */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: 0.35 }}
						className='order-6'
					>
						<VanStatusTile />
					</motion.div>
				</main>
			</div>
		</div>
	)
}
