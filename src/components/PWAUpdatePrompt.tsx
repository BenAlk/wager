import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export function PWAUpdatePrompt() {
	const [showUpdateToast, setShowUpdateToast] = useState(false)

	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(registration) {
			console.log('SW Registered:', registration)
		},
		onRegisterError(error) {
			console.error('SW registration error:', error)
		},
		onNeedRefresh() {
			setShowUpdateToast(true)
		},
	})

	useEffect(() => {
		if (showUpdateToast && needRefresh) {
			// Show toast with update button
			toast(
				<div className='flex items-start gap-3'>
					<RefreshCw className='w-5 h-5 text-blue-400 mt-0.5' />
					<div className='flex-1'>
						<p className='font-semibold text-white mb-1'>Update Available</p>
						<p className='text-sm text-slate-300 mb-3'>
							A new version of Wager is ready to install.
						</p>
						<div className='flex gap-2'>
							<button
								onClick={() => {
									updateServiceWorker(true)
									setNeedRefresh(false)
									setShowUpdateToast(false)
								}}
								className='px-3 py-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white text-sm font-semibold rounded-lg transition-all'
							>
								Update Now
							</button>
							<button
								onClick={() => {
									setShowUpdateToast(false)
									setNeedRefresh(false)
								}}
								className='px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-all'
							>
								Later
							</button>
						</div>
					</div>
				</div>,
				{
					duration: Infinity, // Don't auto-dismiss
					position: 'bottom-center',
					style: {
						background: 'rgba(15, 23, 42, 0.95)',
						border: '1px solid rgba(255, 255, 255, 0.2)',
						backdropFilter: 'blur(16px)',
					},
				}
			)
		}
	}, [showUpdateToast, needRefresh, updateServiceWorker, setNeedRefresh])

	return null // This component doesn't render anything visible itself
}
