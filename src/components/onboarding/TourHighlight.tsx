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
  const [messagePosition, setMessagePosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Find target element and get its position
    const findAndHighlightTarget = () => {
      const target = document.querySelector(targetSelector)
      if (!target) {
        // Retry after a short delay if target not found (page may still be loading)
        setTimeout(findAndHighlightTarget, 100)
        return
      }

      // Determine best position for message box
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const isMobile = viewportWidth < 768 // md breakpoint
      const messageHeight = isMobile ? 180 : 200 // Compact on mobile
      const messageWidth = isMobile ? viewportWidth - 32 : 400 // Full width on mobile with padding

      // Scroll target into view first
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Wait for scroll animation to complete
      // Smooth scrolling can take up to 1000ms for far elements
      // We use a longer delay to ensure accuracy
      setTimeout(() => {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)

        // On mobile, always use top or bottom for compact layout
        if (isMobile) {
          // Check if element is in top half or bottom half
          const elementMiddle = rect.top + rect.height / 2
          if (elementMiddle < viewportHeight / 2) {
            // Element in top half, show message at bottom
            setMessagePosition('bottom')
          } else {
            // Element in bottom half, show message at top
            setMessagePosition('top')
          }
        } else {
          // Desktop: Prefer bottom, but check if there's space
          if (rect.bottom + messageHeight + 20 < viewportHeight) {
            setMessagePosition('bottom')
          } else if (rect.top - messageHeight - 20 > 0) {
            setMessagePosition('top')
          } else if (rect.right + messageWidth + 20 < viewportWidth) {
            setMessagePosition('right')
          } else if (rect.left - messageWidth - 20 > 0) {
            setMessagePosition('left')
          } else {
            setMessagePosition('bottom') // Default fallback
          }
        }
      }, 1000)
    }

    findAndHighlightTarget()

    // Re-calculate on resize
    window.addEventListener('resize', findAndHighlightTarget)
    return () => window.removeEventListener('resize', findAndHighlightTarget)
  }, [targetSelector])

  if (!targetRect) return null

  // Calculate highlight padding based on target
  const getHighlightPadding = () => {
    // Week navigation needs less padding (it's small buttons)
    if (targetSelector.includes('calendar-navigation')) {
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

  // Calculate message box position
  const getMessageStyle = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 768
    const padding = isMobile ? 16 : 20

    switch (messagePosition) {
      case 'bottom':
        if (isMobile) {
          return {
            position: 'fixed',
            bottom: padding,
            left: padding,
            right: padding,
            maxWidth: 'none',
          }
        }
        return {
          position: 'fixed',
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - 400 - padding)),
          maxWidth: '400px',
        }
      case 'top':
        if (isMobile) {
          return {
            position: 'fixed',
            top: padding,
            left: padding,
            right: padding,
            maxWidth: 'none',
          }
        }
        return {
          position: 'fixed',
          bottom: window.innerHeight - targetRect.top + padding,
          left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - 400 - padding)),
          maxWidth: '400px',
        }
      case 'right':
        return {
          position: 'fixed',
          top: Math.max(padding, targetRect.top),
          left: targetRect.right + padding,
          maxWidth: '400px',
        }
      case 'left':
        return {
          position: 'fixed',
          top: Math.max(padding, targetRect.top),
          right: window.innerWidth - targetRect.left + padding,
          maxWidth: '400px',
        }
    }
  }

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

				{/* Message box */}
				<motion.div
					ref={messageRef}
					initial={{ opacity: 0, y: messagePosition === 'bottom' ? -20 : 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0 }}
					className='pointer-events-auto border-2 border-blue-500/50 rounded-xl shadow-2xl p-4 md:p-6'
					style={{
						...getMessageStyle(),
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
