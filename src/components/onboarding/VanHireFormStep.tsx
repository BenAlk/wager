import { useState } from 'react'
import { Truck, Calendar, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from '@/i18n/useTranslation'

interface VanHireFormStepProps {
  onSubmit: (data: VanHireData) => void
  onBack: () => void
}

export interface VanHireData {
  vanType: 'Fleet' | 'Flexi'
  registration: string
  onHireDate: string
  weeklyRate: number
}

export function VanHireFormStep({ onSubmit, onBack }: VanHireFormStepProps) {
  const { t } = useTranslation('onboarding')
  const [vanType, setVanType] = useState<'Fleet' | 'Flexi'>('Fleet')
  const [registration, setRegistration] = useState('')
  const [onHireDate, setOnHireDate] = useState('')
  const [weeklyRate, setWeeklyRate] = useState<number>(250)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!registration.trim()) {
      return
    }
    if (!onHireDate) {
      return
    }

    onSubmit({
      vanType,
      registration: registration.trim().toUpperCase(),
      onHireDate,
      weeklyRate,
    })
  }

  // Update default rate when van type changes
  const handleVanTypeChange = (value: 'Fleet' | 'Flexi') => {
    setVanType(value)
    // Set default rate based on van type
    if (value === 'Fleet') {
      setWeeklyRate(250)
    } else {
      setWeeklyRate(100)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20">
          <Truck className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t('vanHireForm.title')}
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {t('vanHireForm.subtitle')}
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Van Type */}
        <div className="space-y-2">
          <Label htmlFor="vanType" className="text-foreground">
            {t('vanHireForm.vanType')}
          </Label>
          <Select value={vanType} onValueChange={handleVanTypeChange}>
            <SelectTrigger
              id="vanType"
              className="bg-card/50 border-border text-white"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="Fleet" className="text-white hover:bg-slate-700 cursor-pointer">
                {t('vanHireForm.vanTypeFleet')}
              </SelectItem>
              <SelectItem value="Flexi" className="text-white hover:bg-slate-700 cursor-pointer">
                {t('vanHireForm.vanTypeFlexi')}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {vanType === 'Fleet'
              ? t('vanHireForm.vanTypeFleetHelp')
              : t('vanHireForm.vanTypeFlexiHelp')}
          </p>
        </div>

        {/* Registration */}
        <div className="space-y-2">
          <Label htmlFor="registration" className="text-foreground">
            {t('vanHireForm.registration')}
          </Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="registration"
              type="text"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
              placeholder={t('vanHireForm.registrationPlaceholder')}
              required
              className="pl-9 bg-card/50 border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* On-Hire Date */}
        <div className="space-y-2">
          <Label htmlFor="onHireDate" className="text-foreground">
            {t('vanHireForm.onHireDate')}
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="onHireDate"
              type="date"
              value={onHireDate}
              onChange={(e) => setOnHireDate(e.target.value)}
              required
              className="pl-9 bg-card/50 border-border text-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t('vanHireForm.onHireDateHelp')}
          </p>
        </div>

        {/* Weekly Rate */}
        <div className="space-y-2">
          <Label htmlFor="weeklyRate" className="text-foreground">
            {t('vanHireForm.weeklyRate')}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
              £
            </span>
            <NumberInput
              id="weeklyRate"
              value={weeklyRate}
              onChange={setWeeklyRate}
              min={vanType === 'Flexi' ? 100 : 250}
              max={250}
              step={1}
              className="pl-9 bg-card/50 border-border text-foreground"
              disabled={vanType === 'Fleet'}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {vanType === 'Fleet'
              ? t('vanHireForm.weeklyRateFleetHelp')
              : t('vanHireForm.weeklyRateFlexiHelp')}
          </p>
        </div>

        {/* Deposit Info */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>{t('vanHireForm.depositInfoTitle')}</strong> {t('vanHireForm.depositInfo')}
          </p>
        </div>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">{t('vanHireForm.step')}</span>
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            {t('common:actions.back')}
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white"
          >
            {t('vanHireForm.addVan')}
          </Button>
        </div>
      </div>
    </form>
  )
}
