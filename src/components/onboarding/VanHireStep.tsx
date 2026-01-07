import { Truck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/useTranslation'

interface VanHireStepProps {
  onYes: () => void
  onSkip: () => void
  onBack: () => void
}

export function VanHireStep({ onYes, onSkip, onBack }: VanHireStepProps) {
  const { t } = useTranslation('onboarding')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/20">
          <Truck className="w-8 h-8 text-sky-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          {t('vanHire.title')}
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          {t('vanHire.subtitle')}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {/* Yes Option */}
        <button
          onClick={onYes}
          className="w-full p-6 rounded-lg border-2 border-border bg-card/50 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center group"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Truck className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold text-foreground">{t('vanHire.yesAddVan')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('vanHire.yesDescription')}
            </p>
          </div>
        </button>

        {/* Skip Option */}
        <button
          onClick={onSkip}
          className="w-full p-6 rounded-lg border-2 border-border bg-card/50 hover:border-border-hover transition-all text-center group"
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">{t('vanHire.noSkip')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('vanHire.noDescription')}
            </p>
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-3 bg-card/50 border border-border rounded-lg">
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {t('vanHire.info')}
        </p>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">{t('vanHire.step')}</span>
        </div>

        <Button
          onClick={onBack}
          variant="outline"
          className="w-full"
        >
          {t('common:actions.back')}
        </Button>
      </div>
    </div>
  )
}
