import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Calendar, LogOut, Settings, TrendingUp, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

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
	const navigate = useNavigate()
	const [hasWorkToday, setHasWorkToday] = useState(false)

	const handleLogout = async () => {
		try {
			await logout()
			navigate('/auth')
		} catch (error) {
			console.error('Logout error:', error)
			toast.error('Failed to logout. Please try again.')
		}
	}

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
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<header className='flex items-center justify-between mb-6 sm:mb-8'>
					<div className='flex items-center gap-2 sm:gap-3'>
						<div
							className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg'
							role='img'
							aria-label='Wager logo'
						>
							<TrendingUp className='w-5 h-5 sm:w-6 sm:h-6 text-white' aria-hidden='true' />
						</div>
						<div className='hidden sm:block'>
							<h1 className='text-2xl font-bold text-white'>Wager</h1>
							<p className='text-slate-400 text-sm'>
								Welcome back, {user?.user_metadata.display_name}
							</p>
						</div>
						<div className='block sm:hidden'>
							<h1 className='text-lg font-bold text-white'>Wager</h1>
						</div>
					</div>
					<nav aria-label='Main navigation' className='flex items-center gap-1 sm:gap-2'>
						<Button
							onClick={() => navigate('/calendar')}
							variant='outline'
							size='icon-sm'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 sm:size-9 md:h-9 md:w-auto md:px-4'
							aria-label='Go to calendar page'
						>
							<Calendar className='w-4 h-4 md:mr-2' aria-hidden='true' />
							<span className='hidden md:inline'>Calendar</span>
						</Button>
						<Button
							onClick={() => navigate('/vans')}
							variant='outline'
							size='icon-sm'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 sm:size-9 md:h-9 md:w-auto md:px-4'
							aria-label='Go to van management page'
						>
							<Truck className='w-4 h-4 md:mr-2' aria-hidden='true' />
							<span className='hidden md:inline'>Vans</span>
						</Button>
						<Button
							onClick={() => navigate('/settings')}
							variant='outline'
							size='icon-sm'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 sm:size-9 md:h-9 md:w-auto md:px-4'
							aria-label='Go to settings page'
						>
							<Settings className='w-4 h-4 md:mr-2' aria-hidden='true' />
							<span className='hidden md:inline'>Settings</span>
						</Button>
						<Button
							onClick={handleLogout}
							variant='outline'
							size='icon-sm'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 sm:size-9 md:h-9 md:w-auto md:px-4'
							aria-label='Log out of your account'
						>
							<LogOut className='w-4 h-4 md:mr-2' aria-hidden='true' />
							<span className='hidden md:inline'>Logout</span>
						</Button>
					</nav>
				</header>

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
