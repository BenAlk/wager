import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
	icon: LucideIcon
	title: string
	description: string
	actionLabel?: string
	onAction?: () => void
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className='flex flex-col items-center justify-center py-12 px-6 text-center'
		>
			<motion.div
				initial={{ scale: 0 }}
				animate={{ scale: 1 }}
				transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
				className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4'
			>
				<Icon className='w-8 h-8 text-slate-400' />
			</motion.div>

			<h3 className='text-lg font-semibold text-white mb-2'>{title}</h3>
			<p className='text-slate-400 text-sm mb-6 max-w-sm'>{description}</p>

			{actionLabel && onAction && (
				<Button
					onClick={onAction}
					className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white'
				>
					{actionLabel}
				</Button>
			)}
		</motion.div>
	)
}
