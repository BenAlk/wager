import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

export function LoadingScreen() {
	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3 }}
				className='w-full max-w-md'
			>
				<div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8'>
					{/* Logo skeleton */}
					<div className='flex justify-center mb-6'>
						<Skeleton className='w-16 h-16 rounded-xl' />
					</div>

					{/* Title skeleton */}
					<Skeleton className='h-8 w-3/4 mx-auto mb-4' />

					{/* Subtitle skeleton */}
					<Skeleton className='h-4 w-1/2 mx-auto mb-8' />

					{/* Progress bar */}
					<div className='w-full h-1 bg-white/5 rounded-full overflow-hidden'>
						<motion.div
							className='h-full bg-gradient-to-r from-blue-500 to-emerald-500'
							initial={{ width: '0%' }}
							animate={{ width: '100%' }}
							transition={{
								duration: 1.5,
								repeat: Infinity,
								ease: 'easeInOut',
							}}
						/>
					</div>

					{/* Loading text */}
					<p className='text-center text-slate-400 text-sm mt-4'>
						Loading...
					</p>
				</div>
			</motion.div>
		</div>
	)
}
