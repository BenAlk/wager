import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Onboarding Tour Step
 */
export type TourStep =
  | 'dashboard-quick-add-work'
  | 'dashboard-payment'
  | 'dashboard-van-status'
  | 'calendar-navigation'
  | 'calendar-day-cell'
  | 'calendar-week-summary'
  | 'calendar-payment-this-week'
  | 'van-management-top'
  | 'van-management-bottom'
  | 'tour-complete'

/**
 * Onboarding Store State
 */
interface OnboardingState {
  // Onboarding wizard progress
  currentStep: number // 0-5 (Welcome, Pay Rates, Invoicing, Van Hire, Success, Tour)
  isOnboardingOpen: boolean
  hasCompletedOnboarding: boolean
  hasSkippedOnboarding: boolean // User clicked "I'll Set Up Later"

  // Guided tour progress
  isGuidedTourActive: boolean
  currentTourStep: TourStep | null
  tourStepIndex: number // 0-based index for prev/next navigation

  // User selections during onboarding
  wantsVanHire: boolean
  wantsSampleDataTour: boolean

  // Actions
  startOnboarding: () => void
  nextStep: () => void
  previousStep: () => void
  setStep: (step: number) => void
  completeOnboarding: () => void
  skipOnboarding: () => void

  // Guided tour actions
  startGuidedTour: () => void
  nextTourStep: () => void
  previousTourStep: () => void
  completeTour: () => void
  exitTour: () => void

  // User selection actions
  setWantsVanHire: (wants: boolean) => void
  setWantsSampleDataTour: (wants: boolean) => void

  // Reset for testing
  resetOnboarding: () => void
}

/**
 * Tour steps in order
 */
const TOUR_STEPS: TourStep[] = [
  'dashboard-quick-add-work',
  'dashboard-payment',
  'dashboard-van-status',
  'calendar-navigation',
  'calendar-day-cell',
  'calendar-week-summary',
  'calendar-payment-this-week',
  'van-management-top',
  'van-management-bottom',
  'tour-complete',
]

/**
 * Onboarding Store
 *
 * Manages the onboarding wizard flow and guided tour.
 * Persists completion state to localStorage to prevent showing again.
 */
export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentStep: 0,
        isOnboardingOpen: false,
        hasCompletedOnboarding: false,
        hasSkippedOnboarding: false,
        isGuidedTourActive: false,
        currentTourStep: null,
        tourStepIndex: 0,
        wantsVanHire: false,
        wantsSampleDataTour: false,

        // Start onboarding wizard
        startOnboarding: () => {
          set(
            {
              isOnboardingOpen: true,
              currentStep: 0,
              wantsVanHire: false,
              wantsSampleDataTour: false,
            },
            false,
            'onboarding/start'
          )
        },

        // Navigate to next step
        nextStep: () => {
          set(
            (state) => ({
              currentStep: Math.min(state.currentStep + 1, 5),
            }),
            false,
            'onboarding/nextStep'
          )
        },

        // Navigate to previous step
        previousStep: () => {
          set(
            (state) => ({
              currentStep: Math.max(state.currentStep - 1, 0),
            }),
            false,
            'onboarding/previousStep'
          )
        },

        // Jump to specific step
        setStep: (step) => {
          set(
            { currentStep: Math.max(0, Math.min(step, 5)) },
            false,
            'onboarding/setStep'
          )
        },

        // Complete onboarding wizard
        completeOnboarding: () => {
          set(
            {
              hasCompletedOnboarding: true,
              isOnboardingOpen: false,
              currentStep: 0,
            },
            false,
            'onboarding/complete'
          )
        },

        // Skip onboarding (close without completing)
        skipOnboarding: () => {
          set(
            {
              isOnboardingOpen: false,
              currentStep: 0,
              hasSkippedOnboarding: true,
            },
            false,
            'onboarding/skip'
          )
        },

        // Start guided tour
        startGuidedTour: () => {
          set(
            {
              isGuidedTourActive: true,
              currentTourStep: TOUR_STEPS[0],
              tourStepIndex: 0,
            },
            false,
            'onboarding/startTour'
          )
        },

        // Navigate to next tour step
        nextTourStep: () => {
          const { tourStepIndex } = get()
          const nextIndex = tourStepIndex + 1

          if (nextIndex >= TOUR_STEPS.length) {
            // Tour complete
            set(
              {
                currentTourStep: 'tour-complete',
                tourStepIndex: TOUR_STEPS.length - 1,
              },
              false,
              'onboarding/tourComplete'
            )
          } else {
            set(
              {
                currentTourStep: TOUR_STEPS[nextIndex],
                tourStepIndex: nextIndex,
              },
              false,
              'onboarding/nextTourStep'
            )
          }
        },

        // Navigate to previous tour step
        previousTourStep: () => {
          const { tourStepIndex } = get()
          const prevIndex = Math.max(tourStepIndex - 1, 0)

          set(
            {
              currentTourStep: TOUR_STEPS[prevIndex],
              tourStepIndex: prevIndex,
            },
            false,
            'onboarding/previousTourStep'
          )
        },

        // Complete tour
        completeTour: () => {
          set(
            {
              isGuidedTourActive: false,
              currentTourStep: null,
              tourStepIndex: 0,
            },
            false,
            'onboarding/completeTour'
          )
        },

        // Exit tour early
        exitTour: () => {
          set(
            {
              isGuidedTourActive: false,
              currentTourStep: null,
              tourStepIndex: 0,
            },
            false,
            'onboarding/exitTour'
          )
        },

        // Set wants van hire during onboarding
        setWantsVanHire: (wants) => {
          set(
            { wantsVanHire: wants },
            false,
            'onboarding/setWantsVanHire'
          )
        },

        // Set wants sample data tour
        setWantsSampleDataTour: (wants) => {
          set(
            { wantsSampleDataTour: wants },
            false,
            'onboarding/setWantsSampleDataTour'
          )
        },

        // Reset onboarding (for testing / "Restart Tour")
        resetOnboarding: () => {
          set(
            {
              currentStep: 0,
              isOnboardingOpen: false,
              hasCompletedOnboarding: false,
              hasSkippedOnboarding: false,
              isGuidedTourActive: false,
              currentTourStep: null,
              tourStepIndex: 0,
              wantsVanHire: false,
              wantsSampleDataTour: false,
            },
            false,
            'onboarding/reset'
          )
        },
      }),
      {
        name: 'wager-onboarding',
        // Only persist completion and skip state
        partialize: (state) => ({
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          hasSkippedOnboarding: state.hasSkippedOnboarding,
        }),
      }
    ),
    { name: 'OnboardingStore' }
  )
)

/**
 * Selectors for common onboarding queries
 */
export const selectShouldShowOnboarding = (state: OnboardingState) =>
  !state.hasCompletedOnboarding && !state.hasSkippedOnboarding

export const selectTourProgress = (state: OnboardingState) => ({
  current: state.tourStepIndex + 1,
  total: TOUR_STEPS.length,
  step: state.currentTourStep,
})
