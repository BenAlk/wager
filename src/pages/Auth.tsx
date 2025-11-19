import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, sendPasswordResetEmail, signUp } from '@/lib/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = loginSchema.extend({
	displayName: z
		.string()
		.min(1, 'Display name is required')
		.max(50, 'Display name must be less than 50 characters'),
	firstName: z
		.string()
		.max(50, 'First name must be less than 50 characters')
		.optional()
		.or(z.literal('')),
	lastName: z
		.string()
		.max(50, 'Last name must be less than 50 characters')
		.optional()
		.or(z.literal('')),
})

const forgotPasswordSchema = z.object({
	email: z.string().email('Invalid email address'),
})

type LoginFormData = z.infer<typeof loginSchema>
type SignUpFormData = z.infer<typeof signUpSchema>
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function Auth() {
	const navigate = useNavigate()
	const [isLogin, setIsLogin] = useState(true)
	const [isForgotPassword, setIsForgotPassword] = useState(false)
	const [resetEmailSent, setResetEmailSent] = useState(false)

	const loginForm = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	})

	const signUpForm = useForm<SignUpFormData>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			email: '',
			password: '',
			displayName: '',
			firstName: '',
			lastName: '',
		},
	})

	const forgotPasswordForm = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: '',
		},
	})

	const {
		handleSubmit: handleLoginSubmit,
		register: registerLogin,
		formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
	} = loginForm

	const {
		handleSubmit: handleSignUpSubmit,
		register: registerSignUp,
		formState: { errors: signUpErrors, isSubmitting: isSignUpSubmitting },
	} = signUpForm

	const {
		handleSubmit: handleForgotPasswordSubmit,
		register: registerForgotPassword,
		formState: {
			errors: forgotPasswordErrors,
			isSubmitting: isForgotPasswordSubmitting,
		},
	} = forgotPasswordForm

	const errors = isForgotPassword
		? forgotPasswordErrors
		: isLogin
			? loginErrors
			: signUpErrors
	const isSubmitting = isForgotPassword
		? isForgotPasswordSubmitting
		: isLogin
			? isLoginSubmitting
			: isSignUpSubmitting

	const onSubmit = async (data: LoginFormData | SignUpFormData) => {
		try {
			if (isLogin) {
				const { email, password } = data as LoginFormData
				await login({ email, password })
				toast.success('Welcome back!', { duration: 3000 })
				navigate('/dashboard')
			} else {
				const { email, password, displayName, firstName, lastName } = data as SignUpFormData

				try {
					await signUp({ email, password, displayName, firstName, lastName })
					toast.success('Account created successfully!', { duration: 3000 })
					navigate('/dashboard')
				} catch (signupErr) {
					// Check if error is due to existing user
					const errorMessage =
						signupErr instanceof Error ? signupErr.message : 'Signup failed'

					if (
						errorMessage.includes('User already registered') ||
						errorMessage.includes('already registered') ||
						errorMessage.includes('already been registered') ||
						errorMessage.toLowerCase().includes('duplicate')
					) {
						// Set error on the email field
						signUpForm.setError('email', {
							type: 'manual',
							message: 'An account with this email already exists',
						})
						toast.error(
							'An account with this email already exists. Please login instead.',
							{ duration: 4000 }
						)
					} else {
						// Other signup errors
						throw signupErr
					}
					return
				}
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Authentication failed'
			toast.error(errorMessage, { duration: 4000 })
		}
	}

	const onForgotPasswordSubmit = async (data: ForgotPasswordFormData) => {
		try {
			const { email } = data
			const result = await sendPasswordResetEmail(email)

			if (result.success) {
				setResetEmailSent(true)
				toast.success(result.message, { duration: 5000 })
			} else {
				toast.error(result.message, { duration: 4000 })
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to send reset email'
			toast.error(errorMessage, { duration: 4000 })
		}
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-[var(--bg-page-from)] via-[var(--bg-page-via)] to-[var(--bg-page-to)] flex items-center justify-center p-4'>
			{/* Ambient Glow */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-1/2 -right-1/2 w-full h-full bg-[var(--gradient-primary-from)]/5 rounded-full blur-3xl'></div>
				<div className='absolute -bottom-1/2 -left-1/2 w-full h-full bg-[var(--gradient-primary-to)]/5 rounded-full blur-3xl'></div>
			</div>

			{/* Auth Card */}
			<Card className='relative w-full max-w-md bg-[var(--bg-surface-primary)] backdrop-blur-xl border border-[var(--border-primary)] shadow-2xl p-8'>
				{/* Logo/Header */}
				<div className='flex flex-col items-center mb-8'>
					{isForgotPassword && (
						<button
							onClick={() => {
								setIsForgotPassword(false)
								setResetEmailSent(false)
							}}
							className='self-start flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4'
						>
							<ArrowLeft className='w-4 h-4' />
							<span className='text-sm'>Back to login</span>
						</button>
					)}
					<div className='w-16 h-16 bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--gradient-primary-from)]/25'>
						<TrendingUp className='w-8 h-8 text-[var(--text-primary)]' />
					</div>
					<h1 className='text-3xl font-bold text-[var(--text-primary)] mb-2'>
						{isForgotPassword ? 'Reset Password' : 'Wager'}
					</h1>
					<p className='text-[var(--text-secondary)] text-center'>
						{isForgotPassword
							? 'Enter your email to receive a password reset link'
							: 'Track your pay, predict your earnings'}
					</p>
				</div>

				{/* Tab Switcher - Hidden in forgot password mode */}
				{!isForgotPassword && (
					<div className='flex gap-2 p-1 bg-[var(--bg-surface-secondary)] rounded-lg mb-6'>
						<button
							onClick={() => setIsLogin(true)}
							className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
								isLogin
									? 'bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] text-[var(--text-primary)] shadow-lg'
									: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'
							}`}
						>
							Login
						</button>
						<button
							onClick={() => setIsLogin(false)}
							className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
								!isLogin
									? 'bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] text-[var(--text-primary)] shadow-lg'
									: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer'
							}`}
						>
							Sign Up
						</button>
					</div>
				)}

				{/* Forgot Password Form */}
				{isForgotPassword ? (
					resetEmailSent ? (
						<div className='space-y-4'>
							<div className='bg-[var(--bg-success)]/10 border border-[var(--border-success)] rounded-lg p-4'>
								<p className='text-[var(--text-primary)] text-center'>
									If an account exists with this email, a password reset link has
									been sent. Please check your inbox and spam folder.
								</p>
							</div>
							<Button
								onClick={() => {
									setIsForgotPassword(false)
									setResetEmailSent(false)
								}}
								className='w-full bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)]
									hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)]
									text-[var(--text-primary)] font-semibold py-6 rounded-lg
									shadow-lg shadow-[var(--gradient-primary-from)]/25
									transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
							>
								Back to Login
							</Button>
						</div>
					) : (
						<form
							onSubmit={handleForgotPasswordSubmit(onForgotPasswordSubmit)}
							className='space-y-4'
						>
							<div>
								<Label
									htmlFor='reset-email'
									className='text-[var(--input-label)]'
								>
									Email
								</Label>
								<Input
									id='reset-email'
									type='email'
									placeholder='you@example.com'
									autoComplete='email'
									{...registerForgotPassword('email')}
									className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
										focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
								/>
								{forgotPasswordErrors.email && (
									<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
										{forgotPasswordErrors.email.message as string}
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
								{isSubmitting ? 'Sending...' : 'Send Reset Link'}
							</Button>
						</form>
					)
				) : (
					/* Login/Signup Form */
					<form
						onSubmit={
							isLogin
								? handleLoginSubmit(onSubmit)
								: handleSignUpSubmit(onSubmit)
						}
						className='space-y-4'
					>
					{/* Display Name - Animated */}
					{!isLogin && (
						<>
							<div>
								<Label
									htmlFor='displayName'
									className='text-[var(--input-label)]'
								>
									Display Name <span className='text-[var(--text-error)]'>*</span>
								</Label>
								<Input
									id='displayName'
									type='text'
									placeholder='Speedy McDelivery'
									autoComplete='name'
									{...registerSignUp('displayName')}
									className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
										focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
								/>
								{signUpErrors.displayName && (
									<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
										{signUpErrors.displayName.message as string}
									</p>
								)}
							</div>

							{/* First Name */}
							<div>
								<Label
									htmlFor='firstName'
									className='text-[var(--input-label)]'
								>
									First Name <span className='text-xs text-[var(--text-tertiary)]'>(optional)</span>
								</Label>
								<Input
									id='firstName'
									type='text'
									placeholder='John'
									autoComplete='given-name'
									{...registerSignUp('firstName')}
									className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
										focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
								/>
								{signUpErrors.firstName && (
									<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
										{signUpErrors.firstName.message as string}
									</p>
								)}
							</div>

							{/* Last Name */}
							<div>
								<Label
									htmlFor='lastName'
									className='text-[var(--input-label)]'
								>
									Last Name <span className='text-xs text-[var(--text-tertiary)]'>(optional)</span>
								</Label>
								<Input
									id='lastName'
									type='text'
									placeholder='Doe'
									autoComplete='family-name'
									{...registerSignUp('lastName')}
									className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
										focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
								/>
								{signUpErrors.lastName && (
									<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
										{signUpErrors.lastName.message as string}
									</p>
								)}
							</div>
						</>
					)}

					<div>
						<Label
							htmlFor='email'
							className='text-[var(--input-label)]'
						>
							Email
						</Label>
						<Input
							id='email'
							type='email'
							placeholder='you@example.com'
							autoComplete='email'
							{...(isLogin ? registerLogin('email') : registerSignUp('email'))}
							className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
								focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
						/>
						{errors.email && (
							<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
								{errors.email.message as string}
							</p>
						)}
					</div>

					<div>
						<Label
							htmlFor='password'
							className='text-[var(--input-label)]'
						>
							Password
						</Label>
						<Input
							id='password'
							type='password'
							placeholder='••••••••'
							autoComplete={isLogin ? 'current-password' : 'new-password'}
							{...(isLogin
								? registerLogin('password')
								: registerSignUp('password'))}
							className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
								focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
						/>
						{(isLogin ? loginErrors.password : signUpErrors.password) ? (
							<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
								{(isLogin
									? loginErrors.password?.message
									: signUpErrors.password?.message) as string}
							</p>
						) : (
							!isLogin && (
								<p className='text-xs text-[var(--text-secondary)] mt-1.5'>
									At least 6 characters
								</p>
							)
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
						{isSubmitting
							? 'Please wait...'
							: isLogin
								? 'Login'
								: 'Create Account'}
					</Button>

					{/* Forgot Password Link - Only show on login */}
					{isLogin && (
						<div className='text-center'>
							<button
								type='button'
								onClick={() => setIsForgotPassword(true)}
								className='text-sm text-[var(--text-link)] hover:text-[var(--text-link-hover)] transition-colors cursor-pointer'
							>
								Forgot your password?
							</button>
						</div>
					)}
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
