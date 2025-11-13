import { Eye, X } from 'lucide-react'
import { useOnboardingStore } from '@/store/onboardingStore'
import { motion, AnimatePresence } from 'framer-motion'

export function SampleDataBadge() {
  const { isSampleDataMode, disableSampleDataMode, isGuidedTourActive } = useOnboardingStore()

  // Don't show badge during guided tour (tour has its own overlay)
  if (!isSampleDataMode || isGuidedTourActive) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full shadow-lg">
          <Eye className="w-4 h-4" />
          <span className="text-sm font-semibold">Viewing Sample Data</span>
          <button
            onClick={disableSampleDataMode}
            className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Exit sample data mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
