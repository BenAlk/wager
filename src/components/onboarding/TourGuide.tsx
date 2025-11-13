import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOnboardingStore, type TourStep } from '@/store/onboardingStore'
import { TourHighlight } from './TourHighlight'

const TOUR_STEPS_CONFIG: Record<TourStep, {
  title: string
  description: string
  targetSelector: string
  route: string
  nextLabel?: string
}> = {
  'dashboard-quick-add-work': {
    title: 'Quick Add Work',
    description: 'Add today\'s work quickly from the dashboard. Select your route type and the app auto-calculates your daily rate.',
    targetSelector: '[data-tour="quick-add-work"]',
    route: '/dashboard',
  },
  'dashboard-payment': {
    title: 'Payment This Week',
    description: 'See your expected bank deposit with full breakdown. This shows Week N-2 standard pay plus Week N-6 performance bonus.',
    targetSelector: '[data-tour="payment-tile"]',
    route: '/dashboard',
  },
  'dashboard-van-status': {
    title: 'Van Status',
    description: 'Track your van deposit progress and weekly costs. See how much you\'ve paid and how much remains to reach £500.',
    targetSelector: '[data-tour="van-status"]',
    route: '/dashboard',
  },
  'calendar-navigation': {
    title: 'Week Navigation',
    description: 'Navigate between weeks to view past and future work. Use Previous, Today, and Next buttons or jump to a specific week.',
    targetSelector: '[data-tour="week-nav"]',
    route: '/calendar',
  },
  'calendar-day-cell': {
    title: 'Day Cells',
    description: 'Click any day to view details or add work. Each cell shows route type, pay, sweeps, and mileage at a glance.',
    targetSelector: '[data-tour="day-cell"]',
    route: '/calendar',
  },
  'calendar-week-summary': {
    title: 'Week Summary',
    description: 'Full pay breakdown including base pay, 6-day bonus, sweeps, mileage, and van costs. Enter performance rankings here too.',
    targetSelector: '[data-tour="week-summary"]',
    route: '/calendar',
  },
  'calendar-payment-this-week': {
    title: 'Payment This Week',
    description: 'See what\'s hitting your bank account this week. Standard pay from 2 weeks ago plus performance bonus from 6 weeks ago.',
    targetSelector: '[data-tour="payment-this-week"]',
    route: '/calendar',
  },
  'van-management-top': {
    title: 'Van Management - Add & Track',
    description: 'Use this top section to add new van hires and track your deposit progress. The deposit tracker shows how much you\'ve paid and what remains.',
    targetSelector: '[data-tour="van-management-top"]',
    route: '/vans',
  },
  'van-management-bottom': {
    title: 'Van Management - Van History',
    description: 'View all your van hires here. See active vans, off-hired vans, and manage your complete van history.',
    targetSelector: '[data-tour="van-management-bottom"]',
    route: '/vans',
  },
  'tour-complete': {
    title: 'Ready to Track Your Pay!',
    description: 'You\'ve completed the tour! Click the Quick Add Work tile above to log your first day, or explore at your own pace.',
    targetSelector: '[data-tour="quick-add-work"]',
    route: '/dashboard',
    nextLabel: 'Exit Tour',
  },
}

export function TourGuide() {
  const {
    isGuidedTourActive,
    currentTourStep,
    tourStepIndex,
    nextTourStep,
    previousTourStep,
    completeTour,
    exitTour,
  } = useOnboardingStore()

  const navigate = useNavigate()
  const location = useLocation()

  // Navigate to correct route when tour step changes
  useEffect(() => {
    if (isGuidedTourActive && currentTourStep) {
      const stepConfig = TOUR_STEPS_CONFIG[currentTourStep]
      if (stepConfig && location.pathname !== stepConfig.route) {
        navigate(stepConfig.route)
      }
    }
  }, [currentTourStep, isGuidedTourActive, navigate, location.pathname])

  if (!isGuidedTourActive || !currentTourStep) return null

  const stepConfig = TOUR_STEPS_CONFIG[currentTourStep]
  if (!stepConfig) return null

  const totalSteps = Object.keys(TOUR_STEPS_CONFIG).length

  const handleNext = () => {
    if (currentTourStep === 'tour-complete') {
      completeTour()
    } else {
      nextTourStep()
    }
  }

  const handleBack = () => {
    if (tourStepIndex > 0) {
      previousTourStep()
    }
  }

  return (
    <TourHighlight
      title={stepConfig.title}
      description={stepConfig.description}
      targetSelector={stepConfig.targetSelector}
      onNext={handleNext}
      onBack={tourStepIndex > 0 ? handleBack : undefined}
      onExit={exitTour}
      showBack={tourStepIndex > 0}
      showNext={true}
      nextLabel={stepConfig.nextLabel}
      currentStep={tourStepIndex}
      totalSteps={totalSteps}
    />
  )
}
