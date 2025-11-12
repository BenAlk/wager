import { Edit, Calendar, Truck, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/calculations'
import type { VanHire } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface VanHireCardProps {
	van: VanHire
	onEdit: (van: VanHire) => void
	isActive: boolean
}

export function VanHireCard({ van, onEdit, isActive }: VanHireCardProps) {
	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		})
	}

	const getVanTypeColor = (type: string | null) => {
		switch (type) {
			case 'Fleet':
				return 'bg-[var(--bg-van-fleet)] text-[var(--text-van-fleet)] border-[var(--border-van-fleet)]'
			case 'Flexi':
				return 'bg-[var(--bg-van-flexi)] text-[var(--text-van-flexi)] border-[var(--border-van-flexi)]'
			default:
				return 'bg-[var(--bg-surface-tertiary)] text-[var(--text-secondary)] border-[var(--border-secondary)]'
		}
	}

	// Calculate hire duration
	const onHireDate = new Date(van.on_hire_date)
	const offHireDate = van.off_hire_date ? new Date(van.off_hire_date) : new Date()
	const durationDays = Math.ceil(
		(offHireDate.getTime() - onHireDate.getTime()) / (1000 * 60 * 60 * 24)
	)
	const durationWeeks = Math.floor(durationDays / 7)

	return (
		<Card className='bg-[var(--bg-surface-primary)] backdrop-blur-xl border-[var(--border-primary)] p-6 hover:bg-[var(--tile-hover)] transition-colors'>
			<div className='flex items-start justify-between mb-4'>
				<div className='flex items-start gap-4'>
					<div className='p-3 rounded-xl bg-gradient-to-br from-[var(--tile-icon-enabled-from)] to-[var(--tile-icon-enabled-to)] border border-[var(--border-secondary)]'>
						<Truck className='w-6 h-6 text-[var(--text-primary)]' />
					</div>
					<div>
						<div className='flex items-center gap-3 mb-2'>
							<h3 className='text-xl font-bold text-[var(--text-primary)]'>
								{van.registration}
							</h3>
							{isActive && (
								<Badge className='bg-[var(--bg-success)] text-[var(--text-success)] border-[var(--border-success)]'>
									Active
								</Badge>
							)}
							{van.van_type && (
								<Badge className={getVanTypeColor(van.van_type)}>
									{van.van_type}
								</Badge>
							)}
						</div>
						<div className='flex items-center gap-4 text-sm text-[var(--text-secondary)]'>
							<div className='flex items-center gap-1'>
								<Calendar className='w-4 h-4' />
								<span>{formatDate(van.on_hire_date)}</span>
							</div>
							{van.off_hire_date && (
								<>
									<span>→</span>
									<div className='flex items-center gap-1'>
										<Calendar className='w-4 h-4' />
										<span>{formatDate(van.off_hire_date)}</span>
									</div>
								</>
							)}
							{!van.off_hire_date && <span className='text-[var(--text-success)]'>Ongoing</span>}
						</div>
					</div>
				</div>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => onEdit(van)}
					className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
				>
					<Edit className='w-4 h-4' />
				</Button>
			</div>

			<div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
				<div>
					<p className='text-[var(--text-secondary)] text-sm mb-1'>Weekly Rate</p>
					<p className='text-lg font-mono font-bold text-[var(--text-primary)]'>
						{formatCurrency(van.weekly_rate)}
					</p>
				</div>
				<div>
					<p className='text-[var(--text-secondary)] text-sm mb-1'>Duration</p>
					<p className='text-lg font-bold text-[var(--text-primary)]'>
						{durationWeeks}w {durationDays % 7}d
					</p>
				</div>
				<div>
					<p className='text-[var(--text-secondary)] text-sm mb-1'>Status</p>
					{van.deposit_refunded ? (
						<p className='text-[var(--text-success)] font-semibold flex items-center gap-1'>
							<CheckCircle2 className='w-4 h-4' />
							Refunded
						</p>
					) : van.off_hire_date && van.deposit_hold_until ? (
						<p className='text-[var(--text-warning)] font-semibold'>
							Hold until {formatDate(van.deposit_hold_until)}
						</p>
					) : isActive ? (
						<p className='text-[var(--text-info)] font-semibold'>Active</p>
					) : (
						<p className='text-[var(--text-secondary)] font-semibold'>Completed</p>
					)}
				</div>
			</div>

			{van.notes && (
				<div className='mt-4 pt-4 border-t border-[var(--border-secondary)]'>
					<p className='text-[var(--text-secondary)] text-sm'>{van.notes}</p>
				</div>
			)}
		</Card>
	)
}
