import DayCell from '@/components/calendar/DayCell'
import DayEditModal from '@/components/calendar/DayEditModal'
import WeekSummary from '@/components/calendar/WeekSummary'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { fetchWeekWithWorkDays } from '@/lib/api/weeks'
import { formatWeekRange, getWeekDates } from '@/lib/dates'
import { useCalendarStore } from '@/store/calendarStore'
import { getWeekKey, isCacheStale, useWeeksStore } from '@/store/weeksStore'
import {
	ArrowLeft,
	Calendar as CalendarIcon,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Calendar() {
	const navigate = useNavigate()
	const { user } = useAuth()
	const { currentWeek, goToPreviousWeek, goToNextWeek, goToToday } =
		useCalendarStore()
	const { cache, loadingWeeks, setWeek, setLoading } = useWeeksStore()
	const [editingDate, setEditingDate] = useState<Date | null>(null)

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

	// Calculate week date range
	const weekDates = getWeekDates(currentWeek.week, currentWeek.year)
	const dateRangeText = formatWeekRange(currentWeek.week, currentWeek.year)

	// Fetch week data when week changes or cache is stale
	useEffect(() => {
		if (!user) return

		const loadWeekData = async () => {
			// Check if we need to fetch
			if (cachedWeek && !isCacheStale(cachedWeek)) {
				return // Data is fresh, no need to fetch
			}

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

		loadWeekData()
	}, [
		user,
		currentWeek.week,
		currentWeek.year,
		weekKey,
		cachedWeek,
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
