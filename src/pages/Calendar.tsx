import DayCell from '@/components/calendar/DayCell'
import DayEditModal from '@/components/calendar/DayEditModal'
import PaymentThisWeek from '@/components/calendar/PaymentThisWeek'
import WeekSummary from '@/components/calendar/WeekSummary'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { fetchWeekWithWorkDays } from '@/lib/api/weeks'
import { formatWeekRange, getPreviousWeek, getWeekDates } from '@/lib/dates'
import { useCalendarStore } from '@/store/calendarStore'
import { getWeekKey, isCacheStale, useWeeksStore } from '@/store/weeksStore'
import {
	ArrowLeft,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Calendar() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { user } = useAuth()
	const { currentWeek, goToPreviousWeek, goToNextWeek, goToToday, setCurrentWeek } =
		useCalendarStore()
	const { cache, loadingWeeks, setWeek, setLoading } = useWeeksStore()
	const [editingDate, setEditingDate] = useState<Date | null>(null)

	// Handle URL query parameters for week navigation
	useEffect(() => {
		const weekParam = searchParams.get('week')
		const yearParam = searchParams.get('year')

		if (weekParam && yearParam) {
			const week = parseInt(weekParam, 10)
			const year = parseInt(yearParam, 10)

			if (!isNaN(week) && !isNaN(year) && week >= 1 && week <= 53) {
				const weekInfo = getPreviousWeek(week, year, 0) // Get WeekInfo for the specified week
				setCurrentWeek(weekInfo)
			}
		}
	}, [searchParams, setCurrentWeek])

	// Get current week data from cache
	const weekKey = getWeekKey(currentWeek.week, currentWeek.year)
	const cachedWeek = cache.get(weekKey)
	const currentWeekData = cachedWeek
		? {
				...cachedWeek.week,
				work_days: cachedWeek.workDays,
		  }
		: undefined
	const loading = loadingWeeks.has(weekKey)

	// Calculate Week N-2 and Week N-6 for payment display
	const weekNMinus2Info = getPreviousWeek(currentWeek.week, currentWeek.year, 2)
	const weekNMinus6Info = getPreviousWeek(currentWeek.week, currentWeek.year, 6)

	// Get Week N-2 data (standard pay received this week)
	const weekNMinus2Key = getWeekKey(weekNMinus2Info.week, weekNMinus2Info.year)
	const cachedWeekNMinus2 = cache.get(weekNMinus2Key)
	const weekNMinus2Data = cachedWeekNMinus2
		? {
				...cachedWeekNMinus2.week,
				work_days: cachedWeekNMinus2.workDays,
		  }
		: undefined

	// Get Week N-6 data (bonus received this week)
	const weekNMinus6Key = getWeekKey(weekNMinus6Info.week, weekNMinus6Info.year)
	const cachedWeekNMinus6 = cache.get(weekNMinus6Key)
	const weekNMinus6Data = cachedWeekNMinus6
		? {
				...cachedWeekNMinus6.week,
				work_days: cachedWeekNMinus6.workDays,
		  }
		: undefined

	// Calculate week date range
	const weekDates = getWeekDates(currentWeek.week, currentWeek.year)
	const dateRangeText = formatWeekRange(currentWeek.week, currentWeek.year)

	// Fetch week data when week changes or cache is stale
	useEffect(() => {
		if (!user) return

		const loadWeekData = async () => {
			// Fetch current week data
			if (!cachedWeek || isCacheStale(cachedWeek)) {
				try {
					setLoading(weekKey, true)

					const result = await fetchWeekWithWorkDays(
						user.id,
						currentWeek.week,
						currentWeek.year
					)

					if (result) {
						setWeek(result.week, result.workDays)
					}
				} catch (error) {
					console.error('Error fetching week data:', error)
				} finally {
					setLoading(weekKey, false)
				}
			}

			// Fetch Week N-2 data (for payment display)
			if (!cachedWeekNMinus2 || isCacheStale(cachedWeekNMinus2)) {
				try {
					setLoading(weekNMinus2Key, true)

					const result = await fetchWeekWithWorkDays(
						user.id,
						weekNMinus2Info.week,
						weekNMinus2Info.year
					)

					if (result) {
						setWeek(result.week, result.workDays)
					}
				} catch (error) {
					console.error('Error fetching Week N-2 data:', error)
				} finally {
					setLoading(weekNMinus2Key, false)
				}
			}

			// Fetch Week N-6 data (for bonus payment display)
			if (!cachedWeekNMinus6 || isCacheStale(cachedWeekNMinus6)) {
				try {
					setLoading(weekNMinus6Key, true)

					const result = await fetchWeekWithWorkDays(
						user.id,
						weekNMinus6Info.week,
						weekNMinus6Info.year
					)

					if (result) {
						setWeek(result.week, result.workDays)
					}
				} catch (error) {
					console.error('Error fetching Week N-6 data:', error)
				} finally {
					setLoading(weekNMinus6Key, false)
				}
			}
		}

		loadWeekData()
	}, [
		user,
		currentWeek.week,
		currentWeek.year,
		weekKey,
		cachedWeek,
		weekNMinus2Key,
		cachedWeekNMinus2,
		weekNMinus2Info.week,
		weekNMinus2Info.year,
		weekNMinus6Key,
		cachedWeekNMinus6,
		weekNMinus6Info.week,
		weekNMinus6Info.year,
		setWeek,
		setLoading,
	])

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
			{/* Header */}
			<header className='border-b border-white/10 bg-white/5 backdrop-blur-xl'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<Button
								onClick={() => navigate('/dashboard')}
								variant='ghost'
								size='icon'
								className='text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer'
							>
								<ArrowLeft className='w-5 h-5' />
							</Button>
							<div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center'>
								<CalendarIcon className='w-6 h-6 text-white' />
							</div>
							<h1 className='text-2xl font-bold text-white'>Calendar</h1>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{/* Week Navigation */}
				<div className='mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
					<div className='flex items-center gap-3'>
						<Button
							onClick={goToPreviousWeek}
							variant='ghost'
							size='icon'
							className='text-white hover:bg-white/10 cursor-pointer'
						>
							<ChevronLeft className='w-5 h-5' />
						</Button>
						<div className='text-center min-w-[280px]'>
							<h2 className='text-2xl font-bold text-white'>
								Week {currentWeek.week}
							</h2>
							<p className='text-sm text-slate-400'>{dateRangeText}</p>
						</div>
						<Button
							onClick={goToNextWeek}
							variant='ghost'
							size='icon'
							className='text-white hover:bg-white/10 cursor-pointer'
						>
							<ChevronRight className='w-5 h-5' />
						</Button>
					</div>
					<Button
						onClick={goToToday}
						className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white cursor-pointer'
					>
						Today
					</Button>
				</div>

				{/* Calendar Grid */}
				<div className='grid grid-cols-1 lg:grid-cols-7 gap-4 mb-8'>
					{weekDates.map((date) => (
						<DayCell
							key={date.toISOString()}
							date={date}
							weekData={currentWeekData}
							onEdit={() => setEditingDate(date)}
							loading={loading}
						/>
					))}
				</div>

				{/* Week Summary */}
				<WeekSummary
					weekData={currentWeekData}
					weekNumber={currentWeek.week}
					year={currentWeek.year}
				/>

				{/* Payment This Week */}
				<PaymentThisWeek
					weekNumber={currentWeek.week}
					year={currentWeek.year}
					weekNMinus2Data={weekNMinus2Data}
					weekNMinus6Data={weekNMinus6Data}
				/>
			</main>

			{/* Day Edit Modal */}
			{editingDate && (
				<DayEditModal
					date={editingDate}
					weekData={currentWeekData}
					onClose={() => setEditingDate(null)}
				/>
			)}
		</div>
	)
}
