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
				return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
			case 'Flexi':
				return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
			default:
				return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
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
		<Card className='bg-white/10 backdrop-blur-xl border-white/20 p-6 hover:bg-white/[0.12] transition-colors'>
			<div className='flex items-start justify-between mb-4'>
				<div className='flex items-start gap-4'>
					<div className='p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10'>
						<Truck className='w-6 h-6 text-white' />
					</div>
					<div>
						<div className='flex items-center gap-3 mb-2'>
							<h3 className='text-xl font-bold text-white'>
								{van.registration}
							</h3>
							{isActive && (
								<Badge className='bg-emerald-500/20 text-emerald-400 border-emerald-500/30'>
									Active
								</Badge>
							)}
							{van.van_type && (
								<Badge className={getVanTypeColor(van.van_type)}>
									{van.van_type}
								</Badge>
							)}
						</div>
						<div className='flex items-center gap-4 text-sm text-slate-400'>
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
							{!van.off_hire_date && <span className='text-emerald-400'>Ongoing</span>}
						</div>
					</div>
				</div>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => onEdit(van)}
					className='text-slate-400 hover:text-white hover:bg-white/10'
				>
					<Edit className='w-4 h-4' />
				</Button>
			</div>

			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				<div>
					<p className='text-slate-400 text-sm mb-1'>Weekly Rate</p>
					<p className='text-lg font-mono font-bold text-white'>
						{formatCurrency(van.weekly_rate)}
					</p>
				</div>
				<div>
					<p className='text-slate-400 text-sm mb-1'>Duration</p>
					<p className='text-lg font-bold text-white'>
						{durationWeeks}w {durationDays % 7}d
					</p>
				</div>
				<div>
					<p className='text-slate-400 text-sm mb-1'>Deposit Paid</p>
					<div className='flex items-center gap-2'>
						<p className='text-lg font-mono font-bold text-white'>
							{formatCurrency(van.deposit_paid)}
						</p>
						{van.deposit_complete && (
							<CheckCircle2 className='w-4 h-4 text-emerald-400' />
						)}
					</div>
				</div>
				<div>
					<p className='text-slate-400 text-sm mb-1'>Status</p>
					{van.deposit_refunded ? (
						<p className='text-emerald-400 font-semibold flex items-center gap-1'>
							<CheckCircle2 className='w-4 h-4' />
							Refunded
						</p>
					) : van.off_hire_date && van.deposit_hold_until ? (
						<p className='text-yellow-400 font-semibold'>
							Hold until {formatDate(van.deposit_hold_until)}
						</p>
					) : isActive ? (
						<p className='text-blue-400 font-semibold'>Active</p>
					) : (
						<p className='text-slate-400 font-semibold'>Completed</p>
					)}
				</div>
			</div>

			{van.notes && (
				<div className='mt-4 pt-4 border-t border-white/10'>
					<p className='text-slate-400 text-sm'>{van.notes}</p>
				</div>
			)}
		</Card>
	)
}
