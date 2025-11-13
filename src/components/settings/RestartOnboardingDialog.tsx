import { AlertTriangle, BookOpen, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RestartOnboardingDialogProps {
  isOpen: boolean
  onClose: () => void
  onFullOnboarding: () => void
  onTourOnly: () => void
}

export function RestartOnboardingDialog({
  isOpen,
  onClose,
  onFullOnboarding,
  onTourOnly,
}: RestartOnboardingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[var(--modal-bg)] text-[var(--text-primary)]">
        <DialogTitle className="text-xl font-semibold text-foreground">
          Restart Onboarding
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Choose how you'd like to restart the onboarding process
        </DialogDescription>

        <div className="space-y-3 mt-4">
          {/* Full Onboarding Option */}
          <button
            onClick={onFullOnboarding}
            className="w-full p-4 bg-card/50 hover:bg-card/70 border-2 border-border hover:border-blue-500/50 rounded-lg transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                <RotateCcw className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Full Onboarding
                </h3>
                <p className="text-sm text-muted-foreground">
                  Start completely fresh. This will delete all your entered data (work days, van hires, settings) and begin from scratch.
                </p>
              </div>
            </div>
          </button>

          {/* Tour Only Option */}
          <button
            onClick={onTourOnly}
            className="w-full p-4 bg-card/50 hover:bg-card/70 border-2 border-border hover:border-emerald-500/50 rounded-lg transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                <BookOpen className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Tour Only
                </h3>
                <p className="text-sm text-muted-foreground">
                  Keep your data and just view the guided tour with sample data. Your real data won't be affected.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-4">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-yellow-500">Full Onboarding Warning:</strong> This action cannot be undone. All work days, van hires, and settings will be permanently deleted.
          </p>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
