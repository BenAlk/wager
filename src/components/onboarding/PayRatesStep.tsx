import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NumberInput } from '@/components/ui/number-input'
import { useTranslation } from '@/i18n/useTranslation'

interface PayRatesStepProps {
  normalRate: number // in pounds
  drsRate: number // in pounds
  onNormalRateChange: (value: number) => void
  onDrsRateChange: (value: number) => void
  onNext: () => void
  onBack: () => void
}

export function PayRatesStep({
  normalRate,
  drsRate,
  onNormalRateChange,
  onDrsRateChange,
  onNext,
  onBack,
}: PayRatesStepProps) {
  const { t } = useTranslation('onboarding')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t('payRates.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('payRates.subtitle')}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Normal Route Rate */}
        <div className="space-y-2">
          <label htmlFor="normal-rate" className="text-sm font-medium text-foreground block">
            {t('payRates.normalRouteRate')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
              £
            </span>
            <NumberInput
              id="normal-rate"
              value={normalRate}
              onChange={onNormalRateChange}
              min={0}
              max={500}
              step={5}
              className="pl-8"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {t('payRates.perDay')}
            </span>
          </div>
        </div>

        {/* DRS Route Rate */}
        <div className="space-y-2">
          <label htmlFor="drs-rate" className="text-sm font-medium text-foreground block">
            {t('payRates.drsRouteRate')}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
              £
            </span>
            <NumberInput
              id="drs-rate"
              value={drsRate}
              onChange={onDrsRateChange}
              min={0}
              max={500}
              step={5}
              className="pl-8"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {t('payRates.perDay')}
            </span>
          </div>
        </div>
      </div>

      {/* Manager Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {t('payRates.disclaimer.title')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('payRates.disclaimer.description')}
          </p>
        </div>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">{t('payRates.step')}</span>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            {t('common:actions.back')}
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold"
          >
            {t('common:actions.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
