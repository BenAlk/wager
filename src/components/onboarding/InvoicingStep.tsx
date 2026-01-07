import { Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/useTranslation'

type InvoicingService = 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'

interface InvoicingStepProps {
  selectedService: InvoicingService
  onServiceChange: (service: InvoicingService) => void
  onNext: () => void
  onBack: () => void
}

export function InvoicingStep({
  selectedService,
  onServiceChange,
  onNext,
  onBack,
}: InvoicingStepProps) {
  const { t } = useTranslation('onboarding')

  const INVOICING_OPTIONS = [
    {
      value: 'Self-Invoicing' as const,
      label: t('invoicing.options.selfInvoicing.label'),
      cost: t('invoicing.options.selfInvoicing.cost'),
      description: t('invoicing.options.selfInvoicing.description'),
      features: [
        t('invoicing.options.selfInvoicing.features.noDeduction'),
        t('invoicing.options.selfInvoicing.features.fullControl'),
        t('invoicing.options.selfInvoicing.features.bestFor'),
      ],
    },
    {
      value: 'Verso-Basic' as const,
      label: t('invoicing.options.versoBasic.label'),
      cost: t('invoicing.options.versoBasic.cost'),
      description: t('invoicing.options.versoBasic.description'),
      features: [
        t('invoicing.options.versoBasic.features.invoicing'),
        t('invoicing.options.versoBasic.features.insurance'),
        t('invoicing.options.versoBasic.features.ltdCompany'),
      ],
    },
    {
      value: 'Verso-Full' as const,
      label: t('invoicing.options.versoFull.label'),
      cost: t('invoicing.options.versoFull.cost'),
      description: t('invoicing.options.versoFull.description'),
      features: [
        t('invoicing.options.versoFull.features.fullInvoicing'),
        t('invoicing.options.versoFull.features.accounting'),
        t('invoicing.options.versoFull.features.insurance'),
        t('invoicing.options.versoFull.features.ltdCompany'),
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t('invoicing.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('invoicing.subtitle')}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {INVOICING_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onServiceChange(option.value)}
            className={`
              w-full p-4 rounded-lg border-2 transition-all text-left
              ${
                selectedService === option.value
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-border bg-card/50 hover:border-border-hover'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{option.label}</h3>
                  <span className="text-sm font-mono font-semibold text-emerald-400">
                    {option.cost}
                    <span className="text-muted-foreground text-xs">{t('invoicing.perWeek')}</span>
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
                <ul className="space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Checkmark */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                  ${
                    selectedService === option.value
                      ? 'bg-blue-500'
                      : 'bg-muted/20 border border-border'
                  }
                `}
              >
                {selectedService === option.value && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 p-3 bg-card/50 border border-border rounded-lg">
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {t('invoicing.info')}
        </p>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">{t('invoicing.step')}</span>
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
