import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/lib/auth'
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
		return (
			<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
				<p className='text-white text-lg'>Loading...</p>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8'>
			<div className='max-w-7xl mx-auto'>
				{/* Header */}
				<div className='flex items-center justify-between mb-8'>
					<div className='flex items-center gap-3'>
						<div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg'>
							<TrendingUp className='w-6 h-6 text-white' />
						</div>
						<div className='hidden sm:block'>
							<h1 className='text-2xl font-bold text-white'>Wager</h1>
							<p className='text-slate-400 text-sm'>
								Welcome back, {user?.user_metadata.display_name}
							</p>
						</div>
						<div className='block sm:hidden'>
							<h1 className='text-xl font-bold text-white'>Wager</h1>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<Button
							onClick={() => navigate('/calendar')}
							variant='outline'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer'
							aria-label='Calendar'
						>
							<Calendar className='w-4 h-4 md:mr-2' />
							<span className='hidden md:inline'>Calendar</span>
						</Button>
						<Button
							onClick={() => navigate('/vans')}
							variant='outline'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer'
							aria-label='Vans'
						>
							<Truck className='w-4 h-4 md:mr-2' />
							<span className='hidden md:inline'>Vans</span>
						</Button>
						<Button
							onClick={() => navigate('/settings')}
							variant='outline'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer'
							aria-label='Settings'
						>
							<Settings className='w-4 h-4 md:mr-2' />
							<span className='hidden md:inline'>Settings</span>
						</Button>
						<Button
							onClick={handleLogout}
							variant='outline'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10 cursor-pointer'
							aria-label='Logout'
						>
							<LogOut className='w-4 h-4 md:mr-2' />
							<span className='hidden md:inline'>Logout</span>
						</Button>
					</div>
				</div>

				{/* Dashboard Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
					{/* Quick Add Work - Mobile: 1st, Desktop: Top-left */}
					<div className='order-1'>
						<QuickAddWorkTile
							onWorkAdded={() => {
								setHasWorkToday(true)
							}}
						/>
					</div>

					{/* Quick Add Sweeps - Mobile: 2nd, Desktop: Middle-left */}
					<div className='order-2 md:order-3'>
						<QuickAddSweepsTile hasWorkToday={hasWorkToday} />
					</div>

					{/* Quick Add Odometer - Mobile: 3rd, Desktop: Bottom-left */}
					<div className='order-3 md:order-5'>
						<QuickAddOdometerTile hasWorkToday={hasWorkToday} />
					</div>

					{/* Payment This Week - Mobile: 4th, Desktop: Top-right */}
					<div className='order-4 md:order-2'>
						<PaymentTile />
					</div>

					{/* Rankings Reminder - Mobile: 5th, Desktop: Middle-right */}
					<div className='order-5 md:order-4'>
						<RankingsReminderTile />
					</div>

					{/* Van Status - Mobile: 6th, Desktop: Bottom-right */}
					<div className='order-6'>
						<VanStatusTile />
					</div>
				</div>
			</div>
		</div>
	)
}
