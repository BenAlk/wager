import { useEffect, useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

interface TourHighlightProps {
  title: string
  description: string
  targetSelector: string // CSS selector for element to highlight
  onNext?: () => void
  onBack?: () => void
  onExit: () => void
  showBack?: boolean
  showNext?: boolean
  nextLabel?: string
  currentStep: number
  totalSteps: number
}

export function TourHighlight({
  title,
  description,
  targetSelector,
  onNext,
  onBack,
  onExit,
  showBack = true,
  showNext = true,
  nextLabel = 'Next',
  currentStep,
  totalSteps,
}: TourHighlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [messageAtTop, setMessageAtTop] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let retryTimeoutId: ReturnType<typeof setTimeout> | undefined
    let recalcDelayTimeoutId: ReturnType<typeof setTimeout> | undefined

    // Find target element and highlight it
    const findAndHighlightTarget = () => {
      const target = document.querySelector(targetSelector)
      if (!target) {
        // Retry after a short delay if target not found
        retryTimeoutId = setTimeout(findAndHighlightTarget, 100)
        return
      }

      // Scroll to top of page first to ensure consistent positioning
      window.scrollTo({ top: 0, behavior: 'auto' })

      // Then scroll element into view
      target.scrollIntoView({ behavior: 'auto', block: 'center' })

      // Calculate position immediately after instant scroll
      const rect = target.getBoundingClientRect()
      setTargetRect(rect)

      // Determine if message should be at top or bottom
      // If element is in bottom half of screen, show message at top
      const viewportHeight = window.innerHeight
      const elementMiddle = rect.top + rect.height / 2
      setMessageAtTop(elementMiddle > viewportHeight / 2)

      // Recalculate after a brief moment to catch any layout shifts
      // This fixes issues when elements settle after initial render (animations, etc.)
      recalcDelayTimeoutId = setTimeout(() => {
        const updatedRect = target.getBoundingClientRect()
        setTargetRect(updatedRect)

        const updatedMiddle = updatedRect.top + updatedRect.height / 2
        setMessageAtTop(updatedMiddle > viewportHeight / 2)
      }, 300)
    }

    // Add a small initial delay to let the page render after route change
    // This is especially important on mobile when navigating between routes
    // Extended delay for dashboard animations to complete
    const initialDelayTimeoutId = setTimeout(() => {
      findAndHighlightTarget()
    }, 400)

    // Re-calculate on resize
    const handleResize = () => {
      const target = document.querySelector(targetSelector)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)

        // Update message position based on element location
        const viewportHeight = window.innerHeight
        const elementMiddle = rect.top + rect.height / 2
        setMessageAtTop(elementMiddle > viewportHeight / 2)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(retryTimeoutId)
      clearTimeout(initialDelayTimeoutId)
      clearTimeout(recalcDelayTimeoutId)
    }
  }, [targetSelector])

  if (!targetRect) return null

  // Calculate highlight padding based on target
  const getHighlightPadding = () => {
    // Week navigation needs less padding (it's small buttons)
    if (targetSelector.includes('week-nav')) {
      return { top: 4, right: 4, bottom: 4, left: 4 }
    }
    // Week summary needs more padding to capture the whole card
    if (targetSelector.includes('week-summary')) {
      return { top: 12, right: 12, bottom: 12, left: 12 }
    }
    // Default padding
    return { top: 8, right: 8, bottom: 8, left: 8 }
  }

  const highlightPadding = getHighlightPadding()

  return (
		<AnimatePresence>
			<div className='fixed inset-0 z-50 pointer-events-none'>
				{/* Highlight cutout with overlay */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className='absolute pointer-events-none'
					style={{
						top: targetRect.top - highlightPadding.top,
						left: targetRect.left - highlightPadding.left,
						width:
							targetRect.width + highlightPadding.left + highlightPadding.right,
						height:
							targetRect.height +
							highlightPadding.top +
							highlightPadding.bottom,
						boxShadow:
							'0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
						borderRadius: '12px',
					}}
				/>

				{/* Clickable overlay for exit */}
				<div
					className='absolute inset-0 pointer-events-auto'
					onClick={onExit}
					style={{ zIndex: -1 }}
				/>

				{/* Pulsing ring animation */}
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: [0.5, 0, 0.5], scale: [0.95, 1.05, 0.95] }}
					transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
					className='absolute pointer-events-none'
					style={{
						top: targetRect.top - highlightPadding.top,
						left: targetRect.left - highlightPadding.left,
						width:
							targetRect.width + highlightPadding.left + highlightPadding.right,
						height:
							targetRect.height +
							highlightPadding.top +
							highlightPadding.bottom,
						border: '4px solid rgb(59, 130, 246)',
						borderRadius: '12px',
					}}
				/>

				{/* Message box - Fixed position (top or bottom based on element location) */}
				<motion.div
					ref={messageRef}
					initial={{ opacity: 0, y: messageAtTop ? -20 : 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0 }}
					className='pointer-events-auto border-2 border-blue-500/50 rounded-xl shadow-2xl p-4 md:p-6'
					style={{
						position: 'fixed',
						...(messageAtTop ? { top: '20px' } : { bottom: '20px' }),
						left: '16px',
						right: '16px',
						maxWidth: '500px',
						margin: '0 auto',
						zIndex: 100,
						backgroundColor: 'var(--modal-bg)',
					}}
				>
					{/* Close button */}
					<button
						onClick={onExit}
						className='absolute top-2 right-2 md:top-4 md:right-4 transition-colors hover:opacity-80'
						style={{ color: 'var(--text-secondary)' }}
					>
						<X className='w-4 h-4 md:w-5 md:h-5' />
					</button>

					{/* Content */}
					<div className='space-y-3 md:space-y-4'>
						{/* Progress */}
						<div className='flex flex-col items-center gap-2 mt-4'>
							<div className='flex gap-1'>
								{Array.from({ length: totalSteps }).map((_, i) => (
									<div
										key={i}
										className='h-1 w-6 md:w-8 rounded-full transition-colors'
										style={{
											backgroundColor:
												i <= currentStep
													? '#3b82f6'
													: 'var(--border-secondary)',
										}}
									/>
								))}
							</div>
							<span
								className='text-xs ml-auto whitespace-nowrap'
								style={{ color: 'var(--text-secondary)' }}
							>
								{currentStep + 1} of {totalSteps}
							</span>
						</div>

						{/* Title & Description */}
						<div className='space-y-1 md:space-y-2'>
							<h3
								className='text-base md:text-lg font-semibold'
								style={{ color: 'var(--modal-title)' }}
							>
								{title}
							</h3>
							<p
								className='text-xs md:text-sm leading-relaxed'
								style={{ color: 'var(--modal-description)' }}
							>
								{description}
							</p>
						</div>

						{/* Navigation */}
						<div className='flex gap-2 pt-1 md:pt-2'>
							{showBack && onBack && (
								<Button
									onClick={onBack}
									variant='outline'
									size='sm'
									className='flex-1 h-8 md:h-9 text-xs md:text-sm'
									style={{ color: 'var(--modal-title)' }}
								>
									<ChevronLeft className='w-3 h-3 md:w-4 md:h-4 mr-1' />
									Back
								</Button>
							)}
							{showNext && onNext && (
								<Button
									onClick={onNext}
									className='flex-1 h-8 md:h-9 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white'
									size='sm'
								>
									{nextLabel}
									<ChevronRight className='w-3 h-3 md:w-4 md:h-4 ml-1' />
								</Button>
							)}
						</div>
					</div>
				</motion.div>
			</div>
		</AnimatePresence>
	)
}
