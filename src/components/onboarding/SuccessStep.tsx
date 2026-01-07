import { CheckCircle2, Calendar, TrendingUp, Truck, Settings2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/useTranslation'

interface SuccessStepProps {
  onStartTracking: () => void
  onViewSampleData: () => void
}

export function SuccessStep({ onStartTracking, onViewSampleData }: SuccessStepProps) {
  const { t } = useTranslation('onboarding')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground">
          {t('success.title')}
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          {t('success.subtitle')}
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
            <h3 className="font-semibold text-foreground text-sm">{t('success.features.calendar.title')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('success.features.calendar.description')}
            </p>
          </div>
        </div>

        {/* Dashboard */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t('success.features.dashboard.title')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('success.features.dashboard.description')}
            </p>
          </div>
        </div>

        {/* Van Management */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t('success.features.vanManagement.title')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('success.features.vanManagement.description')}
            </p>
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-start gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Settings2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{t('success.features.settings.title')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('success.features.settings.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Tour Option */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-lg space-y-3">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-sm">{t('success.tour.title')}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t('success.tour.description')}
            </p>
          </div>
        </div>
        <Button
          onClick={onViewSampleData}
          variant="outline"
          className="w-full border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10"
        >
          <Eye className="w-4 h-4 mr-2" />
          {t('success.tour.button')}
        </Button>
      </div>

      {/* Progress + Actions */}
      <div className="space-y-4 pt-2">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">{t('success.step')}</span>
        </div>

        <Button
          onClick={onStartTracking}
          className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold h-12"
        >
          {t('success.startTracking')}
        </Button>
      </div>
    </div>
  )
}
