import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/useTranslation'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation('settings')
  const [step, setStep] = useState<'warning' | 'confirm'>(isOpen ? 'warning' : 'warning')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClose = () => {
    if (!isDeleting) {
      setStep('warning')
      setEmail('')
      setPassword('')
      setConfirmText('')
      onClose()
    }
  }

  const handleProceedToConfirm = () => {
    setStep('confirm')
  }

  const handleDeleteAccount = async () => {
    // Validation
    if (!email || !password) {
      toast.error(t('toast:deleteAccount.enterCredentials'))
      return
    }

    if (email !== user?.email) {
      toast.error(t('toast:deleteAccount.emailMismatch'))
      return
    }

    if (confirmText !== 'DELETE MY ACCOUNT') {
      toast.error(t('toast:deleteAccount.confirmTextMismatch'))
      return
    }

    setIsDeleting(true)

    try {
      // Step 1: Re-authenticate the user to verify password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        toast.error(t('toast:deleteAccount.incorrectPassword'))
        setIsDeleting(false)
        return
      }

      // Step 2: Call the delete function (which will cascade delete all user data)
      // @ts-expect-error - RPC function not in generated types yet
      const { error: deleteError } = await supabase.rpc('delete_user_account')

      if (deleteError) {
        console.error('Delete account error:', deleteError)
        toast.error(t('toast:deleteAccount.deleteFailed'))
        setIsDeleting(false)
        return
      }

      // Step 3: Sign out (the auth user will be deleted on the backend)
      await supabase.auth.signOut()

      toast.success(t('toast:deleteAccount.deleted'))
      navigate('/auth')
      handleClose()
    } catch (error) {
      console.error('Unexpected error during account deletion:', error)
      toast.error(t('toast:deleteAccount.unexpectedError'))
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-[var(--modal-bg)] text-[var(--text-primary)]">
        {step === 'warning' ? (
          <>
            <DialogTitle className="text-2xl font-bold text-red-500 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8" />
              {t('deleteAccount.warningTitle')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('deleteAccount.warningDescription')}
            </DialogDescription>

            <div className="space-y-6 py-4">
              {/* Big Warning Box */}
              <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-red-400">
                      {t('deleteAccount.permanentHeading')}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      {t('deleteAccount.permanentText')}
                    </p>
                  </div>
                </div>
              </div>

              {/* What Will Be Deleted */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t('deleteAccount.dataDeletedHeading')}
                </h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t('deleteAccount.dataList.profile')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t('deleteAccount.dataList.workDays')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t('deleteAccount.dataList.vanHires')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t('deleteAccount.dataList.rankings')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t('deleteAccount.dataList.mileage')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{t('deleteAccount.dataList.auth')}</span>
                  </li>
                </ul>
              </div>

              {/* Alternative Actions */}
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-sky-400">
                  {t('deleteAccount.alternativesHeading')}
                </h4>
                <ul className="space-y-1 text-xs text-sky-300/80">
                  <li>• {t('deleteAccount.alternatives.stopUsing')}</li>
                  <li>• {t('deleteAccount.alternatives.clearWeeks')}</li>
                  <li>• {t('deleteAccount.alternatives.resetRates')}</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-[var(--button-secondary-bg)] border-[var(--button-secondary-border)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)]"
              >
                {t('deleteAccount.cancelButton')}
              </Button>
              <Button
                type="button"
                onClick={handleProceedToConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t('deleteAccount.proceedButton')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="text-2xl font-bold text-red-500 flex items-center gap-3">
              <Trash2 className="w-7 h-7" />
              {t('deleteAccount.confirmTitle')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('deleteAccount.confirmDescription')}
            </DialogDescription>

            <div className="space-y-6 py-4">
              {/* Final Warning */}
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                <p className="text-sm text-red-300 font-medium text-center">
                  {t('deleteAccount.lastChance')}
                </p>
              </div>

              {/* Email Verification */}
              <div className="space-y-2">
                <Label htmlFor="delete-email" className="text-[var(--text-primary)]">
                  {t('deleteAccount.emailLabel')}
                </Label>
                <Input
                  id="delete-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={user?.email || 'your.email@example.com'}
                  disabled={isDeleting}
                  className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]"
                  autoComplete="email"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('deleteAccount.emailMatch', { email: user?.email })}
                </p>
              </div>

              {/* Password Verification */}
              <div className="space-y-2">
                <Label htmlFor="delete-password" className="text-[var(--text-primary)]">
                  {t('deleteAccount.passwordLabel')}
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('deleteAccount.passwordPlaceholder')}
                  disabled={isDeleting}
                  className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]"
                  autoComplete="current-password"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('deleteAccount.passwordHelp')}
                </p>
              </div>

              {/* Confirmation Text */}
              <div className="space-y-2">
                <Label htmlFor="confirm-text" className="text-[var(--text-primary)]">
                  {t('deleteAccount.confirmTextLabel')}
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t('deleteAccount.confirmTextPlaceholder')}
                  disabled={isDeleting}
                  className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] font-mono"
                  autoComplete="off"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  {t('deleteAccount.confirmTextHelp')}
                </p>
              </div>

              {/* Final Warning Text */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-xs text-yellow-300/90 text-center">
                  {t('deleteAccount.finalWarning')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('warning')}
                disabled={isDeleting}
                className="bg-[var(--button-secondary-bg)] border-[var(--button-secondary-border)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)]"
              >
                {t('deleteAccount.goBackButton')}
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !email || !password || confirmText !== 'DELETE MY ACCOUNT'}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('deleteAccount.deletingButton')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('deleteAccount.deleteButton')}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
