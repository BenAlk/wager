import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, signUp } from '@/lib/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { TrendingUp } from 'lucide-react'
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
})

type LoginFormData = z.infer<typeof loginSchema>
type SignUpFormData = z.infer<typeof signUpSchema>

export default function Auth() {
	const navigate = useNavigate()
	const [isLogin, setIsLogin] = useState(true)

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

	const errors = isLogin ? loginErrors : signUpErrors
	const isSubmitting = isLogin ? isLoginSubmitting : isSignUpSubmitting

	const onSubmit = async (data: LoginFormData | SignUpFormData) => {
		try {
			if (isLogin) {
				const { email, password } = data as LoginFormData
				await login({ email, password })
				toast.success('Welcome back!', { duration: 3000 })
			} else {
				const { email, password, displayName } = data as SignUpFormData
				await signUp({ email, password, displayName })
				toast.success('Account created successfully!', { duration: 3000 })
			}
			// Navigate to dashboard on success
			navigate('/dashboard')
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Authentication failed'
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
					<div className='w-16 h-16 bg-gradient-to-r from-[var(--gradient-primary-from)] to-[var(--gradient-primary-to)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--gradient-primary-from)]/25'>
						<TrendingUp className='w-8 h-8 text-[var(--text-primary)]' />
					</div>
					<h1 className='text-3xl font-bold text-[var(--text-primary)] mb-2'>Wager</h1>
					<p className='text-[var(--text-secondary)] text-center'>
						Track your pay, predict your earnings
					</p>
				</div>

				{/* Tab Switcher */}
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

				{/* Form */}
				<form
					onSubmit={
						isLogin ? handleLoginSubmit(onSubmit) : handleSignUpSubmit(onSubmit)
					}
					className='space-y-4'
				>
					{/* Display Name - Animated */}
					{!isLogin && (
						<div>
							<Label
								htmlFor='displayName'
								className='text-[var(--input-label)]'
							>
								Display Name
							</Label>
							<Input
								id='displayName'
								type='text'
								placeholder='Ben'
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
							{...(isLogin
								? registerLogin('password')
								: registerSignUp('password'))}
							className='mt-1.5 bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--input-placeholder)]
								focus:ring-2 focus:ring-inset focus:ring-[var(--input-focus-ring)] focus:border-transparent'
						/>
						{errors.password ? (
							<p className='text-xs text-[var(--input-error-text)] mt-1.5'>
								{errors.password.message as string}
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
				</form>

				{/* Footer */}
				<p className='text-center text-[var(--text-secondary)] text-sm mt-6'>
					Built for Amazon DSP couriers
				</p>
			</Card>
		</div>
	)
}
