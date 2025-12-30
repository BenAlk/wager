import { Button } from '@/components/ui/button'
import type { Week, WorkDay } from '@/types/database'
import { format, isAfter, isSameDay } from 'date-fns'
import { Gauge, Package, Plus, Truck } from 'lucide-react'

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
			<div className='bg-[var(--day-bg-empty)] backdrop-blur-sm border border-[var(--day-border)] rounded-lg p-4 animate-pulse'>
				<div className='h-32'></div>
			</div>
		)
	}

	// Empty day cell
	if (!workDay) {
		return (
			<div
				className={`bg-[var(--day-bg-empty)] backdrop-blur-sm border rounded-lg p-4 transition-all hover:bg-[var(--day-hover)] ${
					isToday
						? 'border-[var(--border-focus)] shadow-lg shadow-[var(--border-focus)]/20'
						: 'border-[var(--day-border)]'
				} ${isFuture ? 'opacity-50' : ''}`}
			>
				<div className='flex flex-col h-full min-h-[160px]'>
					<div className='text-center mb-4'>
						<div className='text-xs text-[var(--day-name)]'>{dayName}</div>
						<div className='text-lg font-semibold text-[var(--day-date)]'>
							{dayNumber}
						</div>
					</div>
					<div className='flex-1 flex items-center justify-center'>
						<div className='text-center'>
							<div className='text-sm text-[var(--text-secondary)] mb-12 '>
								OFF
							</div>
							{!isFuture &&
								(canAddWorkDay ? (
									<Button
										onClick={onEdit}
										size='sm'
										variant='ghost'
										className='text-[var(--button-ghost-text)] hover:text-[var(--button-ghost-hover)] hover:bg-[var(--bg-hover)] cursor-pointer'
									>
										<Plus className='w-4 h-4 mr-1' />
										Add
									</Button>
								) : (
									<div className='text-xs text-[var(--text-warning)]/60'>
										Max 6 days
									</div>
								))}
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Work day cell
	const isNormal = workDay.route_type === 'Normal'
	const netSweeps = workDay.stops_taken - workDay.stops_given

	return (
		<div
			className={`bg-[var(--day-bg-work)] backdrop-blur-xl border rounded-lg p-4 transition-all hover:shadow-xl hover:-translate-y-0.5 ${
				isToday
					? 'border-[var(--border-focus)] shadow-lg shadow-[var(--border-focus)]/20'
					: 'border-[var(--day-border)]'
			}`}
		>
			<div className='flex flex-col h-full min-h-[160px]'>
				{/* Header */}
				<div className='flex items-center justify-between mb-3'>
					<div>
						<div className='text-xs text-[var(--day-name)]'>{dayName}</div>
						<div className='text-lg font-semibold text-[var(--day-date)]'>
							{dayNumber}
						</div>
					</div>
					<div
						className={`px-2 py-1 rounded-md flex items-center gap-1 ${
							isNormal
								? 'bg-[var(--bg-route-normal)] text-[var(--text-route-normal)]'
								: 'bg-[var(--bg-route-drs)] text-[var(--text-route-drs)]'
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
					<div className='text-xl font-mono font-bold text-[var(--text-primary)]'>
						£{(workDay.daily_rate / 100).toFixed(2)}
					</div>
				</div>

				{/* Sweeps */}
				{(workDay.stops_given > 0 || workDay.stops_taken > 0) && (
					<div className='flex items-center gap-1 mb-1'>
						<span className='text-[var(--text-secondary)] text-xs'>🔄</span>
						<span
							className={`text-sm font-semibold ${
								netSweeps > 0
									? 'text-[var(--text-sweeps-given)]'
									: netSweeps < 0
									? 'text-[var(--text-sweeps-taken)]'
									: 'text-[var(--text-secondary)]'
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
						<div className='flex justify-evenly pr-1 gap-2'>
							{/* Show only odometer if no Amazon data (estimated) */}
							{(workDay.van_logged_miles ?? 0) > 0 &&
							(workDay.amazon_paid_miles ?? 0) === 0 ? (
								<div className='flex items-center gap-1'>
									<Gauge className='w-3 h-3 text-amber-400' />
									<span className='text-sm font-medium text-amber-400'>
										{workDay.van_logged_miles}m*
									</span>
								</div>
							) : (
								<>
									{/* Show odometer (for discrepancy tracking) */}
									{(workDay.van_logged_miles ?? 0) > 0 && (
										<div className='flex items-center gap-1'>
											<Gauge className='w-3 h-3 text-[var(--text-mileage-van)]' />
											<span className='text-sm font-medium text-[var(--text-mileage-van)]'>
												{workDay.van_logged_miles}m
											</span>
										</div>
									)}
									{/* Show Amazon miles (actual payment) */}
									{(workDay.amazon_paid_miles ?? 0) > 0 && (
										<div className='flex items-center gap-1'>
											<span className='text-[var(--text-mileage-paid)] text-xs'>
												📌
											</span>
											<span className='text-sm font-medium text-[var(--text-mileage-paid)]'>
												{workDay.amazon_paid_miles}m
											</span>
										</div>
									)}
								</>
							)}
						</div>
						<div>
							{(workDay.van_logged_miles ?? 0) > 0 &&
								(workDay.amazon_paid_miles ?? 0) > 0 && (
									<div className='flex items-center justify-center gap-1 mt-0.5'>
										<span className='text-xs text-[var(--color-blue-400)]'>
											Δ
										</span>
										<span
											className={`text-xs font-medium ${
												(workDay.van_logged_miles ?? 0) -
													(workDay.amazon_paid_miles ?? 0) >
												0
													? 'text-[var(--text-mileage-delta-bad)]'
													: (workDay.van_logged_miles ?? 0) -
															(workDay.amazon_paid_miles ?? 0) <
													  0
													? 'text-[var(--text-mileage-delta-good)]'
													: 'text-[var(--text-secondary)]'
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

				{/* Route Number */}
				{workDay.route_number && (
					<div className='mb-2'>
						<div className='text-xs text-[var(--text-secondary)] mb-0.5'>
							Route
						</div>
						<div className='text-sm font-medium text-[var(--text-primary)]'>
							{workDay.route_number}
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className='mt-auto'>
					<Button
						onClick={onEdit}
						size='sm'
						variant='ghost'
						className='w-full text-[var(--button-ghost-text)] hover:text-[var(--button-ghost-hover)] hover:bg-[var(--bg-hover)] cursor-pointer'
					>
						Edit
					</Button>
				</div>
			</div>
		</div>
	)
}
