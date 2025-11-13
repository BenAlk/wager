/**
 * Hook to switch between sample data (for onboarding tour) and real data
 */

import { useOnboardingStore } from '@/store/onboardingStore'
import { SAMPLE_DATA } from '@/lib/sampleData'
import type { Week, WorkDay, VanHire } from '@/types/database'

export function useSampleOrRealData() {
  const { isSampleDataMode } = useOnboardingStore()

  return {
    isSampleDataMode,

    /**
     * Get weeks data (sample or real)
     */
    getWeeks: (realWeeks: Week[]): Week[] => {
      return isSampleDataMode ? SAMPLE_DATA.weeks : realWeeks
    },

    /**
     * Get work days for a specific week (sample or real)
     */
    getWorkDays: (weekId: string, realWorkDays: WorkDay[]): WorkDay[] => {
      if (isSampleDataMode) {
        return SAMPLE_DATA.workDays.filter(wd => wd.week_id === weekId)
      }
      return realWorkDays
    },

    /**
     * Get van hire data (sample or real)
     */
    getVanHires: (realVanHires: VanHire[]): VanHire[] => {
      if (isSampleDataMode) {
        return [SAMPLE_DATA.vanHire]
      }
      return realVanHires
    },

    /**
     * Get active van hire (sample or real)
     */
    getActiveVan: (realActiveVan: VanHire | null): VanHire | null => {
      if (isSampleDataMode) {
        return SAMPLE_DATA.vanHire
      }
      return realActiveVan
    },

    /**
     * Check if we should skip API calls
     */
    shouldSkipApiCalls: (): boolean => {
      return isSampleDataMode
    },
  }
}
