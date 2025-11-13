import { TrendingUp, Calendar, Truck, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WelcomeStepProps {
  onNext: () => void
  onSkip: () => void
}

export function WelcomeStep({ onNext, onSkip }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500">
          <Truck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          Welcome to Wager!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Let's get your pay tracking set up in under 2 minutes.
        </p>
      </div>

      {/* Benefits */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          We need a few quick details to calculate your earnings accurately:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Track Pay */}
          <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Track Pay</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Calculate standard pay, 6-day bonuses, and performance bonuses automatically
              </p>
            </div>
          </div>

          {/* Manage Schedule */}
          <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Weekly Calendar</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Log work days, sweeps, and mileage with an intuitive calendar view
              </p>
            </div>
          </div>

          {/* Van Management */}
          <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Van Tracking</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Track van hire costs, deposits, and mileage discrepancies
              </p>
            </div>
          </div>

          {/* Customizable */}
          <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Settings2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Customizable</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Adjust rates, mileage, and settings to match your DSP's pay structure
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={onNext}
          className="flex-1 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold h-12"
        >
          Let's Go
        </Button>
        <Button
          onClick={onSkip}
          variant="ghost"
          className="sm:w-auto text-muted-foreground hover:text-foreground"
        >
          I'll Set Up Later
        </Button>
      </div>
    </div>
  )
}
