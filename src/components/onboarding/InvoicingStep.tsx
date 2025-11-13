import { Check, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

type InvoicingService = 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'

interface InvoicingStepProps {
  selectedService: InvoicingService
  onServiceChange: (service: InvoicingService) => void
  onNext: () => void
  onBack: () => void
}

const INVOICING_OPTIONS = [
  {
    value: 'Self-Invoicing' as const,
    label: 'Self-Invoicing',
    cost: '£0',
    description: 'Handle your own invoicing and tax returns',
    features: ['No weekly deduction', 'Full control', 'Best for self-employed'],
  },
  {
    value: 'Verso-Basic' as const,
    label: 'Verso Basic',
    cost: '£10',
    description: 'Professional invoicing service',
    features: ['Invoicing service', 'Public liability insurance', 'Requires Ltd company'],
  },
  {
    value: 'Verso-Full' as const,
    label: 'Verso Full',
    cost: '£30',
    description: 'Complete accounting service',
    features: ['Full invoicing', 'Accounting & tax returns', 'Public liability insurance', 'Requires Ltd company'],
  },
]

export function InvoicingStep({
  selectedService,
  onServiceChange,
  onNext,
  onBack,
}: InvoicingStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Invoicing Service
        </h2>
        <p className="text-muted-foreground">
          Choose how you handle invoicing and accounting
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
                    <span className="text-muted-foreground text-xs">/week</span>
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
          This affects your weekly deductions. You can change this anytime in Settings.
        </p>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Step 2 of 4</span>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
