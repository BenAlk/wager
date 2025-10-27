import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Settings, LogOut } from 'lucide-react'

export default function Dashboard() {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	const handleLogout = async () => {
		await logout()
		navigate('/auth')
	}

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
								Welcome back, {user?.email}
							</p>
						</div>
						<div className='block sm:hidden'>
							<h1 className='text-xl font-bold text-white'>Wager</h1>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<Button
							onClick={() => navigate('/settings')}
							variant='outline'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10'
							aria-label='Settings'
						>
							<Settings className='w-4 h-4 md:mr-2' />
							<span className='hidden md:inline'>Settings</span>
						</Button>
						<Button
							onClick={handleLogout}
							variant='outline'
							className='bg-white/5 border-white/10 text-white hover:bg-white/10'
							aria-label='Logout'
						>
							<LogOut className='w-4 h-4 md:mr-2' />
							<span className='hidden md:inline'>Logout</span>
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className='bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8'>
					<h2 className='text-xl font-bold text-white mb-4'>
						Dashboard Coming Soon
					</h2>
					<p className='text-slate-300'>
						Authentication is working! Now we'll build out the calendar, pay
						tracking, and other features.
					</p>
				</div>
			</div>
		</div>
	)
}
