import { Button } from '@/components/ui/button'
import type { Week, WorkDay } from '@/types/database'
import { format, isAfter, isSameDay } from 'date-fns'
import { Package, Plus, Truck } from 'lucide-react'

interface DayCellProps {
	date: Date
	weekData: Week | undefined
	onEdit: () => void
	loading: boolean
}

export default function DayCell({
	date,
	weekData,
	onEdit,
	loading,
}: DayCellProps) {
	const today = new Date()
	const isToday = isSameDay(date, today)
	const isFuture = isAfter(date, today)

	// Find work day data for this date
	const workDay = weekData?.work_days?.find((wd: WorkDay) =>
		isSameDay(new Date(wd.date), date)
	)

	// Check if week already has 6 work days (max allowed)
	const daysWorkedCount = weekData?.work_days?.length || 0
	const canAddWorkDay = daysWorkedCount < 6

	// Format day name and date
	const dayName = format(date, 'EEE').toUpperCase()
	const dayNumber = format(date, 'd')

	if (loading) {
		return (
			<div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 animate-pulse'>
				<div className='h-32'></div>
			</div>
		)
	}

	// Empty day cell
	if (!workDay) {
		return (
			<div
				className={`bg-white/5 backdrop-blur-sm border rounded-lg p-4 transition-all hover:bg-white/10 ${
					isToday
						? 'border-blue-500 shadow-lg shadow-blue-500/20'
						: 'border-white/10'
				} ${isFuture ? 'opacity-50' : ''}`}
			>
				<div className='flex flex-col h-full min-h-[160px]'>
					<div className='text-center mb-4'>
						<div className='text-xs text-slate-400'>{dayName}</div>
						<div className='text-lg font-semibold text-white'>{dayNumber}</div>
					</div>
					<div className='flex-1 flex items-center justify-center'>
						<div className='text-center'>
							<div className='text-sm text-slate-400 mb-12 '>OFF</div>
							{!isFuture &&
								(canAddWorkDay ? (
									<Button
										onClick={onEdit}
										size='sm'
										variant='ghost'
										className='text-blue-400 hover:text-blue-300 hover:bg-white/5 cursor-pointer'
									>
										<Plus className='w-4 h-4 mr-1' />
										Add
									</Button>
								) : (
									<div className='text-xs text-amber-400/60'>Max 6 days</div>
								))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Work day cell
	const isNormal = workDay.route_type === 'Normal'
	const netSweeps = workDay.stops_given - workDay.stops_taken

	return (
		<div
			className={`bg-white/10 backdrop-blur-xl border rounded-lg p-4 transition-all hover:shadow-xl hover:-translate-y-0.5 ${
				isToday
					? 'border-blue-500 shadow-lg shadow-blue-500/20'
					: 'border-white/20'
			}`}
		>
			<div className='flex flex-col h-full min-h-[160px]'>
				{/* Header */}
				<div className='flex items-center justify-between mb-3'>
					<div>
						<div className='text-xs text-slate-400'>{dayName}</div>
						<div className='text-lg font-semibold text-white'>{dayNumber}</div>
					</div>
					<div
						className={`px-2 py-1 rounded-md flex items-center gap-1 ${
							isNormal
								? 'bg-blue-500/20 text-blue-400'
								: 'bg-purple-500/20 text-purple-400'
						}`}
					>
						{isNormal ? (
							<Truck className='w-4 h-4' />
						) : (
							<Package className='w-4 h-4' />
						)}
						<span className='text-xs font-medium'>
							{isNormal ? 'Std.' : 'DRS'}
						</span>
					</div>
				</div>

				{/* Daily Rate */}
				<div className='mb-2'>
					<div className='text-xl font-mono font-bold text-white'>
						£{(workDay.daily_rate / 100).toFixed(2)}
					</div>
				</div>

				{/* Sweeps */}
				{(workDay.stops_given > 0 || workDay.stops_taken > 0) && (
					<div className='flex items-center gap-1 mb-1'>
						<span className='text-slate-400 text-xs'>🔄</span>
						<span
							className={`text-sm font-semibold ${
								netSweeps > 0
									? 'text-emerald-400'
									: netSweeps < 0
									? 'text-red-400'
									: 'text-slate-400'
							}`}
						>
							{netSweeps > 0 ? '+' : ''}
							{netSweeps}
						</span>
					</div>
				)}

				{/* Mileage */}
				{((workDay.amazon_paid_miles ?? 0) > 0 ||
					(workDay.van_logged_miles ?? 0) > 0) && (
					<div className='mb-3'>
						<div className='flex justify-between gap-5'>
							{(workDay.van_logged_miles ?? 0) > 0 && (
								<div className='flex items-center gap-1'>
									<span className='text-yellow-400 text-xs'>📌</span>
									<span className='text-sm font-medium text-yellow-400'>
										{workDay.van_logged_miles}m
									</span>
								</div>
							)}
							{(workDay.amazon_paid_miles ?? 0) > 0 && (
								<div className='flex items-center gap-1'>
									<span className='text-slate-400 text-xs'>📍</span>
									<span className='text-sm font-medium text-white'>
										{workDay.amazon_paid_miles}m
									</span>
								</div>
							)}
						</div>
						<div>
							{(workDay.van_logged_miles ?? 0) > 0 &&
								(workDay.amazon_paid_miles ?? 0) > 0 && (
									<div className='flex items-center justify-center gap-1 mt-0.5'>
										<span className='text-xs text-slate-500'>Δ</span>
										<span
											className={`text-xs font-medium ${
												(workDay.van_logged_miles ?? 0) -
													(workDay.amazon_paid_miles ?? 0) >
												0
													? 'text-red-400'
													: (workDay.van_logged_miles ?? 0) -
															(workDay.amazon_paid_miles ?? 0) <
													  0
													? 'text-emerald-400'
													: 'text-slate-400'
											}`}
										>
											{(workDay.van_logged_miles ?? 0) -
												(workDay.amazon_paid_miles ?? 0) >
											0
												? '+'
												: ''}
											{(workDay.van_logged_miles ?? 0) -
												(workDay.amazon_paid_miles ?? 0)}
											m
										</span>
									</div>
								)}
						</div>
					</div>
				)}

				{/* Edit Button */}
				<div className='mt-auto'>
					<Button
						onClick={onEdit}
						size='sm'
						variant='ghost'
						className='w-full text-blue-400 hover:text-blue-300 hover:bg-white/5 cursor-pointer'
					>
						Edit
					</Button>
				</div>
			</div>
		</div>
	)
}
