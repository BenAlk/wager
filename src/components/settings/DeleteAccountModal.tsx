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

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
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
      toast.error('Please enter your email and password')
      return
    }

    if (email !== user?.email) {
      toast.error('Email does not match your account email')
      return
    }

    if (confirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" exactly to confirm')
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
        toast.error('Incorrect password. Please try again.')
        setIsDeleting(false)
        return
      }

      // Step 2: Call the delete function (which will cascade delete all user data)
      // @ts-expect-error - RPC function not in generated types yet
      const { error: deleteError } = await supabase.rpc('delete_user_account')

      if (deleteError) {
        console.error('Delete account error:', deleteError)
        toast.error('Failed to delete account. Please contact support.')
        setIsDeleting(false)
        return
      }

      // Step 3: Sign out (the auth user will be deleted on the backend)
      await supabase.auth.signOut()

      toast.success('Your account has been permanently deleted')
      navigate('/auth')
      handleClose()
    } catch (error) {
      console.error('Unexpected error during account deletion:', error)
      toast.error('An unexpected error occurred. Please try again.')
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
              Delete Account - Final Warning
            </DialogTitle>
            <DialogDescription className="sr-only">
              Warning about permanent account deletion
            </DialogDescription>

            <div className="space-y-6 py-4">
              {/* Big Warning Box */}
              <div className="bg-red-500/10 border-2 border-red-500 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-red-400">
                      This action is PERMANENT and IRREVERSIBLE
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      Once you delete your account, there is no way to recover your data.
                      This is not a temporary deactivation.
                    </p>
                  </div>
                </div>
              </div>

              {/* What Will Be Deleted */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                  The following data will be permanently deleted:
                </h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Your user profile and account settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>All work days and weekly pay data (every week you've tracked)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>All van hire records and deposit information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Performance rankings history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Mileage tracking and pay rate history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>Your authentication credentials (you will be logged out)</span>
                  </li>
                </ul>
              </div>

              {/* Alternative Actions */}
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-semibold text-sky-400">
                  Consider these alternatives:
                </h4>
                <ul className="space-y-1 text-xs text-sky-300/80">
                  <li>• You can simply stop using the app without deleting your account</li>
                  <li>• You can clear individual weeks if you want to start fresh</li>
                  <li>• You can reset your pay rates in Settings if they've changed</li>
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
                Cancel (Keep My Account)
              </Button>
              <Button
                type="button"
                onClick={handleProceedToConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                I Understand - Proceed to Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="text-2xl font-bold text-red-500 flex items-center gap-3">
              <Trash2 className="w-7 h-7" />
              Confirm Account Deletion
            </DialogTitle>
            <DialogDescription className="sr-only">
              Final confirmation step for account deletion
            </DialogDescription>

            <div className="space-y-6 py-4">
              {/* Final Warning */}
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                <p className="text-sm text-red-300 font-medium text-center">
                  Last chance: Enter your credentials to permanently delete your account
                </p>
              </div>

              {/* Email Verification */}
              <div className="space-y-2">
                <Label htmlFor="delete-email" className="text-[var(--text-primary)]">
                  Your Email Address
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
                  Must match: {user?.email}
                </p>
              </div>

              {/* Password Verification */}
              <div className="space-y-2">
                <Label htmlFor="delete-password" className="text-[var(--text-primary)]">
                  Your Password
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  disabled={isDeleting}
                  className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)]"
                  autoComplete="current-password"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  We need to verify your identity before deletion
                </p>
              </div>

              {/* Confirmation Text */}
              <div className="space-y-2">
                <Label htmlFor="confirm-text" className="text-[var(--text-primary)]">
                  Type "DELETE MY ACCOUNT" to confirm
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  disabled={isDeleting}
                  className="bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-primary)] font-mono"
                  autoComplete="off"
                />
                <p className="text-xs text-[var(--text-secondary)]">
                  Type exactly as shown (case sensitive)
                </p>
              </div>

              {/* Final Warning Text */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-xs text-yellow-300/90 text-center">
                  After clicking "Delete My Account Forever", your data will be immediately and
                  permanently deleted. You will be logged out and cannot undo this action.
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
                Go Back
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
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account Forever
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
