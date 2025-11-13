import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/hooks/useAuth'
import { logout } from '@/lib/auth'
import { Calendar, Home, LogOut, Settings, TrendingUp, Truck } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function MainLayout() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	const handleLogout = async () => {
		try {
			await logout()
			navigate('/auth')
		} catch (error) {
			console.error('Logout error:', error)
			toast.error('Failed to logout. Please try again.')
		}
	}

	// Determine the current page for the header title
	const getPageInfo = () => {
		switch (location.pathname) {
			case '/dashboard':
				return { title: 'Dashboard' }
			case '/calendar':
				return { title: 'Calendar' }
			case '/settings':
				return { title: 'Settings' }
			case '/vans':
				return { title: 'Van Management' }
			default:
				return { title: 'Dashboard' }
		}
	}

	const pageInfo = getPageInfo()

	const isActive = (path: string) => location.pathname === path

	return (
		<div className='min-h-screen bg-gradient-to-br from-[var(--bg-page-from)] via-[var(--bg-page-via)] to-[var(--bg-page-to)]'>
			{/* Header */}
			<header className='border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-xl'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
					<div className='flex items-center justify-between'>
						{/* Left: Logo & Page Title */}
						<div className='flex items-center gap-2 sm:gap-3'>
							<div
								className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[var(--nav-logo-from)] to-[var(--nav-logo-to)] rounded-xl flex items-center justify-center shadow-lg'
								role='img'
								aria-label='Wager logo'
							>
								<TrendingUp className='w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-primary)]' aria-hidden='true' />
							</div>
							<div className='hidden sm:block'>
								<h1 className='text-2xl font-bold text-[var(--nav-title)]'>Wager</h1>
								<p className='text-[var(--nav-subtitle)] text-sm'>
									{location.pathname === '/dashboard'
										? `Welcome back, ${user?.user_metadata.display_name}`
										: pageInfo.title}
								</p>
							</div>
							<div className='block sm:hidden'>
								<h1 className='text-lg font-bold text-[var(--nav-title)]'>Wager</h1>
							</div>
						</div>

						{/* Right: Navigation */}
						<nav aria-label='Main navigation' className='flex items-center gap-1 sm:gap-2'>
							<ThemeToggle />
							<Button
								onClick={() => navigate('/dashboard')}
								variant='outline'
								size='icon-sm'
								className={`${
									isActive('/dashboard')
										? 'bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] border-[var(--border-active)] text-[var(--text-primary)]'
										: 'bg-[var(--nav-button-inactive-bg)] border-[var(--nav-button-inactive-border)] text-[var(--nav-button-inactive-text)] hover:bg-[var(--nav-button-hover)]'
								} sm:size-9 md:h-9 md:w-auto md:px-4 cursor-pointer`}
								aria-label='Go to dashboard page'
								aria-current={isActive('/dashboard') ? 'page' : undefined}
							>
								<Home className='w-4 h-4 md:mr-2' aria-hidden='true' />
								<span className='hidden md:inline'>Dashboard</span>
							</Button>
							<Button
								onClick={() => navigate('/calendar')}
								variant='outline'
								size='icon-sm'
								className={`${
									isActive('/calendar')
										? 'bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] border-[var(--border-active)] text-[var(--text-primary)]'
										: 'bg-[var(--nav-button-inactive-bg)] border-[var(--nav-button-inactive-border)] text-[var(--nav-button-inactive-text)] hover:bg-[var(--nav-button-hover)]'
								} sm:size-9 md:h-9 md:w-auto md:px-4 cursor-pointer`}
								aria-label='Go to calendar page'
								aria-current={isActive('/calendar') ? 'page' : undefined}
							>
								<Calendar className='w-4 h-4 md:mr-2' aria-hidden='true' />
								<span className='hidden md:inline'>Calendar</span>
							</Button>
							<Button
								onClick={() => navigate('/vans')}
								variant='outline'
								size='icon-sm'
								className={`${
									isActive('/vans')
										? 'bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] border-[var(--border-active)] text-[var(--text-primary)]'
										: 'bg-[var(--nav-button-inactive-bg)] border-[var(--nav-button-inactive-border)] text-[var(--nav-button-inactive-text)] hover:bg-[var(--nav-button-hover)]'
								} sm:size-9 md:h-9 md:w-auto md:px-4 cursor-pointer`}
								aria-label='Go to van management page'
								aria-current={isActive('/vans') ? 'page' : undefined}
							>
								<Truck className='w-4 h-4 md:mr-2' aria-hidden='true' />
								<span className='hidden md:inline'>Vans</span>
							</Button>
							<Button
								onClick={() => navigate('/settings')}
								variant='outline'
								size='icon-sm'
								className={`${
									isActive('/settings')
										? 'bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] border-[var(--border-active)] text-[var(--text-primary)]'
										: 'bg-[var(--nav-button-inactive-bg)] border-[var(--nav-button-inactive-border)] text-[var(--nav-button-inactive-text)] hover:bg-[var(--nav-button-hover)]'
								} sm:size-9 md:h-9 md:w-auto md:px-4 cursor-pointer`}
								aria-label='Go to settings page'
								aria-current={isActive('/settings') ? 'page' : undefined}
							>
								<Settings className='w-4 h-4 md:mr-2' aria-hidden='true' />
								<span className='hidden md:inline'>Settings</span>
							</Button>
							<Button
								onClick={handleLogout}
								variant='outline'
								size='icon-sm'
								className='bg-[var(--nav-button-inactive-bg)] border-[var(--nav-button-inactive-border)] text-[var(--nav-button-inactive-text)] hover:bg-[var(--nav-button-hover)] sm:size-9 md:h-9 md:w-auto md:px-4 cursor-pointer'
								aria-label='Log out of your account'
							>
								<LogOut className='w-4 h-4 md:mr-2' aria-hidden='true' />
								<span className='hidden md:inline'>Logout</span>
							</Button>
						</nav>
					</div>
				</div>
			</header>

			{/* Main Content - Outlet for nested routes */}
			<Outlet />
		</div>
	)
}
