import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useOnboardingStore, type TourStep } from '@/store/onboardingStore'
import { TourHighlight } from './TourHighlight'
import { useTranslation } from '@/i18n/useTranslation'

export function TourGuide() {
  const { t } = useTranslation('onboarding')
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

  // Define tour steps configuration using translations
  const TOUR_STEPS_CONFIG: Record<TourStep, {
    targetSelector: string
    route: string
    nextLabel?: string
  }> = {
    'dashboard-quick-add-work': {
      targetSelector: '[data-tour="quick-add-work"]',
      route: '/dashboard',
    },
    'dashboard-payment': {
      targetSelector: '[data-tour="payment-tile"]',
      route: '/dashboard',
    },
    'dashboard-van-status': {
      targetSelector: '[data-tour="van-status"]',
      route: '/dashboard',
    },
    'calendar-navigation': {
      targetSelector: '[data-tour="week-nav"]',
      route: '/calendar',
    },
    'calendar-day-cell': {
      targetSelector: '[data-tour="day-cell"]',
      route: '/calendar',
    },
    'calendar-week-summary': {
      targetSelector: '[data-tour="week-summary"]',
      route: '/calendar',
    },
    'calendar-payment-this-week': {
      targetSelector: '[data-tour="payment-this-week"]',
      route: '/calendar',
    },
    'van-management-top': {
      targetSelector: '[data-tour="van-management-top"]',
      route: '/vans',
    },
    'van-management-bottom': {
      targetSelector: '[data-tour="van-management-bottom"]',
      route: '/vans',
    },
    'tour-complete': {
      targetSelector: '[data-tour="quick-add-work"]',
      route: '/dashboard',
      nextLabel: t('tour.exitTour'),
    },
  }

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

  // Helper function to convert step key to translation key
  const getStepTranslationKey = (step: TourStep): string => {
    // Convert 'dashboard-quick-add-work' to 'dashboardQuickAddWork'
    return step.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  const stepKey = getStepTranslationKey(currentTourStep)
  const title = t(`tour.steps.${stepKey}.title`)
  const description = t(`tour.steps.${stepKey}.description`)

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
      title={title}
      description={description}
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
