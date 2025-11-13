import { CheckCircle2, Calendar, TrendingUp, Truck, Settings2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SuccessStepProps {
  onStartTracking: () => void
  onViewSampleData: () => void
}

export function SuccessStep({ onStartTracking, onViewSampleData }: SuccessStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          You're All Set! 🎉
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Your pay tracking is ready to go. Here's what you can do:
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3">
        {/* Calendar */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Calendar</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Track daily work, sweeps, and mileage with a visual weekly view
            </p>
          </div>
        </div>

        {/* Dashboard */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Dashboard</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Quick adds for work, sweeps, and odometer readings. See payment breakdowns.
            </p>
          </div>
        </div>

        {/* Van Management */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Van Management</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Track van hire costs, deposits, and off-hire dates
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Settings2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Settings</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Customize rates, mileage, and invoicing service anytime
            </p>
          </div>
        </div>
      </div>

      {/* Sample Data Option */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-lg space-y-3">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">Want to see how it works first?</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Take a quick guided tour with sample data to explore all features
            </p>
          </div>
        </div>
        <Button
          onClick={onViewSampleData}
          variant="outline"
          className="w-full border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Sample Data Tour
        </Button>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Step 4 of 4</span>
        </div>

        <Button
          onClick={onStartTracking}
          className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold h-12"
        >
          Start Tracking
        </Button>
      </div>
    </div>
  )
}
