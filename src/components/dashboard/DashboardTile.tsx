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
	'data-tour'?: string
}

export function DashboardTile({
	title,
	icon: Icon,
	children,
	className,
	disabled = false,
	'data-tour': dataTour,
}: DashboardTileProps) {
	return (
		<Card
			data-tour={dataTour}
			className={cn(
				'bg-[var(--tile-bg)] backdrop-blur-xl border-[var(--tile-border)] p-6 transition-all h-full min-h-[280px] flex flex-col',
				disabled && 'opacity-50 cursor-not-allowed',
				!disabled && 'hover:bg-[var(--tile-hover)]',
				className
			)}
		>
			<div className='flex items-center gap-3 mb-4'>
				{Icon && (
					<div
						className={cn(
							'p-2 rounded-lg',
							disabled
								? 'bg-[var(--tile-icon-disabled)]'
								: 'bg-gradient-to-r from-[var(--tile-icon-enabled-from)] to-[var(--tile-icon-enabled-to)]'
						)}
					>
						<Icon className='w-5 h-5 text-[var(--text-primary)]' />
					</div>
				)}
				<h3
					className={cn(
						'text-lg font-semibold',
						disabled ? 'text-[var(--tile-title-disabled)]' : 'text-[var(--tile-title)]'
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
