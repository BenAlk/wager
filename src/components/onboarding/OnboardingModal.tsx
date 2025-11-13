import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import { WelcomeStep } from './WelcomeStep'
import { PayRatesStep } from './PayRatesStep'
import { InvoicingStep } from './InvoicingStep'
import { VanHireStep } from './VanHireStep'
import { VanHireFormStep, type VanHireData } from './VanHireFormStep'
import { SuccessStep } from './SuccessStep'

type InvoicingService = 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'

export function OnboardingModal() {
  const {
    currentStep,
    isOnboardingOpen,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    setWantsVanHire,
    setWantsSampleDataTour,
    startGuidedTour,
  } = useOnboardingStore()

  const { userProfile, updateUserProfile } = useAuthStore()
  const { updateSettings } = useSettingsStore()

  // Local state for form values
  const [normalRate, setNormalRate] = useState(160) // £160
  const [drsRate, setDrsRate] = useState(100) // £100
  const [invoicingService, setInvoicingService] = useState<InvoicingService>('Self-Invoicing')
  const [showVanForm, setShowVanForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Close modal when not open
  if (!isOnboardingOpen) return null

  const handleSkip = () => {
    skipOnboarding()
  }

  const handleNext = async () => {
    // If on step 2 (Pay Rates) or step 3 (Invoicing), save settings
    if (currentStep === 1 || currentStep === 2) {
      await saveSettings()
    }
    nextStep()
  }

  const handleBack = () => {
    previousStep()
  }

  const handleVanHireYes = () => {
    setWantsVanHire(true)
    setShowVanForm(true)
  }

  const handleVanHireSkip = () => {
    setWantsVanHire(false)
    nextStep()
  }

  const handleVanFormBack = () => {
    setShowVanForm(false)
  }

  const handleVanFormSubmit = async (data: VanHireData) => {
    // Save van hire to database
    try {
      const userId = userProfile?.id
      if (!userId) throw new Error('No user ID')

      const { error } = await supabase
        .from('van_hires')
        .insert({
          user_id: userId,
          van_type: data.vanType,
          registration: data.registration,
          on_hire_date: data.onHireDate,
          off_hire_date: null, // Still active
          weekly_rate: data.weeklyRate * 100, // Convert to pence
          deposit_paid: 0,
          deposit_complete: false,
          deposit_refunded: false,
        })

      if (error) throw error

      toast.success('Van hire added successfully!')
      nextStep()
    } catch (error) {
      console.error('Error saving van hire:', error)
      toast.error('Failed to add van hire. You can add it later from Van Management.')
      nextStep() // Continue anyway
    }
  }

  const handleStartTracking = async () => {
    await saveSettings()
    await markOnboardingComplete()
    setWantsSampleDataTour(false)
    completeOnboarding()
    toast.success('Welcome to Wager! Start tracking your pay.')
  }

  const handleViewSampleData = async () => {
    try {
      await saveSettings()
      await markOnboardingComplete()

      setWantsSampleDataTour(true)
      completeOnboarding()

      // Start guided tour after modal exit animation (300ms delay)
      setTimeout(() => {
        startGuidedTour()
      }, 300)
    } catch (error) {
      console.error('Error starting tour:', error)
      toast.error('Failed to start tour, but continuing...')

      // Continue anyway
      await markOnboardingComplete()
      setWantsSampleDataTour(true)
      completeOnboarding()

      setTimeout(() => {
        startGuidedTour()
      }, 300)
    }
  }

  const saveSettings = async () => {
    if (isSaving) return
    setIsSaving(true)

    try {
      const userId = userProfile?.id
      if (!userId) throw new Error('No user ID')

      // Convert pounds to pence
      const normalRatePence = Math.round(normalRate * 100)
      const drsRatePence = Math.round(drsRate * 100)

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      let error
      if (existingSettings) {
        // Update existing settings
        const result = await supabase
          .from('user_settings')
          .update({
            normal_rate: normalRatePence,
            drs_rate: drsRatePence,
            invoicing_service: invoicingService,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
        error = result.error
      } else {
        // Insert new settings
        const result = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            normal_rate: normalRatePence,
            drs_rate: drsRatePence,
            invoicing_service: invoicingService,
          })
        error = result.error
      }

      if (error) throw error

      // Update store
      updateSettings({
        normal_rate: normalRatePence,
        drs_rate: drsRatePence,
        invoicing_service: invoicingService,
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const markOnboardingComplete = async () => {
    try {
      const userId = userProfile?.id
      if (!userId) return

      const { error } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      // Update local store
      updateUserProfile({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
      case 1:
        return (
          <PayRatesStep
            normalRate={normalRate}
            drsRate={drsRate}
            onNormalRateChange={setNormalRate}
            onDrsRateChange={setDrsRate}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 2:
        return (
          <InvoicingStep
            selectedService={invoicingService}
            onServiceChange={setInvoicingService}
            onNext={handleNext}
            onBack={handleBack}
          />
        )
      case 3:
        // Show van form if they clicked "Yes", otherwise show yes/no choice
        if (showVanForm) {
          return (
            <VanHireFormStep
              onSubmit={handleVanFormSubmit}
              onBack={handleVanFormBack}
            />
          )
        }
        return (
          <VanHireStep
            onYes={handleVanHireYes}
            onSkip={handleVanHireSkip}
            onBack={handleBack}
          />
        )
      case 4:
        return (
          <SuccessStep
            onStartTracking={handleStartTracking}
            onViewSampleData={handleViewSampleData}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOnboardingOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--modal-bg)] text-[var(--text-primary)]">
        <DialogTitle className="sr-only">Onboarding Wizard</DialogTitle>
        <DialogDescription className="sr-only">
          Complete the setup process to get started with Wager
        </DialogDescription>
        {renderStep()}
      </DialogContent>
    </Dialog>
  )
}
