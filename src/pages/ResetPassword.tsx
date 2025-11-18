import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/lib/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

const resetPasswordSchema = z
	.object({
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
	const navigate = useNavigate()
	const [isSuccess, setIsSuccess] = useState(false)
	const [hasValidToken, setHasValidToken] = useState<boolean | null>(null)
	const [isCheckingToken, setIsCheckingToken] = useState(true)

	const {
		handleSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			password: '',
			confirmPassword: '',
		},
	})

	// Check if user has a valid password reset session
	useEffect(() => {
		const checkResetToken = async () => {
			try {
				const {
					data: { session },
				} = await supabase.auth.getSession()

				// If there's a session, the reset token was valid
				if (session) {
					setHasValidToken(true)
				} else {
					setHasValidToken(false)
				}
			} catch (err) {
				console.error('Error checking reset token:', err)
				setHasValidToken(false)
			} finally {
				setIsCheckingToken(false)
			}
		}

		checkResetToken()
	}, [])

	const onSubmit = async (data: ResetPasswordFormData) => {
		try {
			await updatePassword(data.password)
			setIsSuccess(true)
			toast.success('Password updated successfully!', { duration: 3000 })

			// Redirect to dashboard after 2 seconds
			setTimeout(() => {
				navigate('/dashboard')
			}, 2000)
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to update password'
			toast.error(errorMessage, { duration: 4000 })
		}
	}

	// Show loading while checking token
	if (isCheckingToken) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-[var(--bg-page-from)] via-[var(--bg-page-via)] to-[var(--bg-page-to)] flex items-center justify-center p-4'>
				<Card className='relative w-full max-w-md bg-[var(--bg-surface-primary)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl p-8'>
					<div className='flex flex-col items-center space-y-4'>
						<div className='w-16 h-16 bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--gradient-primary-from)]/25 animate-pulse'>
							<TrendingUp className='w-8 h-8 text-[var(--text-primary)]' />
						</div>
						<p className='text-[var(--text-secondary)]'>
							Verifying reset link...
						</p>
					</div>
				</Card>
			</div>
		)
	}

	// Show error if no valid token
	if (!hasValidToken) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-[var(--bg-page-from)] via-[var(--bg-page-via)] to-[var(--bg-page-to)] flex items-center justify-center p-4'>
				<Card className='relative w-full max-w-md bg-[var(--bg-surface-primary)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl p-8'>
					<div className='flex flex-col items-center mb-8'>
						<div className='w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4'>
							<AlertCircle className='w-8 h-8 text-red-400' />
						</div>
						<h1 className='text-3xl font-bold text-[var(--text-primary)] mb-2'>
							Invalid Reset Link
						</h1>
						<p className='text-[var(--text-secondary)] text-center mb-6'>
							This password reset link is invalid or has expired. Please request
							a new one.
						</p>
						<Button
							onClick={() => navigate('/auth')}
							className='w-full bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)]
								hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)]
								text-[var(--text-primary)] font-semibold py-6 rounded-lg
								shadow-lg shadow-[var(--gradient-primary-from)]/25
								transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
						>
							Back to Login
						</Button>
					</div>
				</Card>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-[var(--bg-page-from)] via-[var(--bg-page-via)] to-[var(--bg-page-to)] flex items-center justify-center p-4'>
			{/* Ambient Glow */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-1/2 -right-1/2 w-full h-full bg-[var(--gradient-primary-from)]/5 rounded-full blur-3xl'></div>
				<div className='absolute -bottom-1/2 -left-1/2 w-full h-full bg-[var(--gradient-primary-to)]/5 rounded-full blur-3xl'></div>
			</div>

			{/* Reset Password Card */}
			<Card className='relative w-full max-w-md bg-[var(--bg-surface-primary)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl p-8'>
				{/* Logo/Header */}
				<div className='flex flex-col items-center mb-8'>
					<div className='w-16 h-16 bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--gradient-primary-from)]/25'>
						<TrendingUp className='w-8 h-8 text-[var(--text-primary)]' />
					</div>
					<h1 className='text-3xl font-bold text-[var(--text-primary)] mb-2'>
						Reset Password
					</h1>
					<p className='text-[var(--text-secondary)] text-center'>
						Choose a new password for your account
					</p>
				</div>

				{isSuccess ? (
					/* Success State */
					<div className='space-y-6 text-center'>
						<div className='flex justify-center'>
							<div className='w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center'>
								<CheckCircle2 className='w-12 h-12 text-emerald-400' />
							</div>
						</div>
						<div className='space-y-2'>
							<h2 className='text-xl font-semibold text-[var(--text-primary)]'>
								Password Updated!
							</h2>
							<p className='text-[var(--text-secondary)]'>
								Your password has been successfully updated. Redirecting you to the
								dashboard...
							</p>
						</div>
					</div>
				) : (
					/* Reset Password Form */
					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<div>
							<Label
								htmlFor='password'
								className='text-[var(--input-label)]'
							>
								New Password
							</Label>
							<Input
								id='password'
								type='password'
								placeholder='••••••••'
								autoComplete='new-password'
								{...register('password')}
								className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
									focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
							/>
							{errors.password ? (
								<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
									{errors.password.message}
								</p>
							) : (
								<p className='text-xs text-[var(--text-secondary)] mt-1.5'>
									At least 6 characters
								</p>
							)}
						</div>

						<div>
							<Label
								htmlFor='confirmPassword'
								className='text-[var(--input-label)]'
							>
								Confirm New Password
							</Label>
							<Input
								id='confirmPassword'
								type='password'
								placeholder='••••••••'
								autoComplete='new-password'
								{...register('confirmPassword')}
								className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
									focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
							/>
							{errors.confirmPassword && (
								<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
									{errors.confirmPassword.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							disabled={isSubmitting}
							className='w-full bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)]
								hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)]
								text-[var(--text-primary)] font-semibold py-6 rounded-lg
								shadow-lg shadow-[var(--gradient-primary-from)]/25
								transition-all transform hover:scale-[1.02] active:scale-[0.98]
								disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
						>
							{isSubmitting ? 'Updating...' : 'Update Password'}
						</Button>

						<div className='text-center'>
							<button
								type='button'
								onClick={() => navigate('/')}
								className='text-sm text-[var(--text-link)] hover:text-[var(--text-link-hover)] transition-colors cursor-pointer'
							>
								Back to login
							</button>
						</div>
					</form>
				)}

				{/* Footer */}
				<p className='text-center text-[var(--text-secondary)] text-sm mt-6'>
					Built for Amazon DSP couriers
				</p>
			</Card>
		</div>
	)
}
