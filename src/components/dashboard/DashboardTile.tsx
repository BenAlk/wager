import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface DashboardTileProps {
	title: string
	icon?: LucideIcon
	children: ReactNode
	className?: string
	disabled?: boolean
}

export function DashboardTile({
	title,
	icon: Icon,
	children,
	className,
	disabled = false,
}: DashboardTileProps) {
	return (
		<Card
			className={cn(
				'bg-white/10 backdrop-blur-xl border-white/20 p-6 transition-all h-full min-h-[280px] flex flex-col',
				disabled && 'opacity-50 cursor-not-allowed',
				!disabled && 'hover:bg-white/[0.15]',
				className
			)}
		>
			<div className='flex items-center gap-3 mb-4'>
				{Icon && (
					<div
						className={cn(
							'p-2 rounded-lg',
							disabled
								? 'bg-slate-700/50'
								: 'bg-gradient-to-r from-blue-500 to-emerald-500'
						)}
					>
						<Icon className='w-5 h-5 text-white' />
					</div>
				)}
				<h3
					className={cn(
						'text-lg font-semibold',
						disabled ? 'text-slate-400' : 'text-white'
					)}
				>
					{title}
				</h3>
			</div>
			<div className={cn('flex-1', disabled && 'pointer-events-none')}>
				{children}
			</div>
		</Card>
	)
}
