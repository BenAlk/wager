import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login, signUp } from '@/lib/auth'
import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
	const navigate = useNavigate()
	const [isLogin, setIsLogin] = useState(true)
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)

		try {
			if (isLogin) {
				await login({ email, password })
			} else {
				await signUp({ email, password, displayName })
			}
			// Navigate to dashboard on success
			navigate('/dashboard')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Authentication failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
			{/* Ambient Glow */}
			<div className='absolute inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-1/2 -right-1/2 w-full h-full bg-blue-500/5 rounded-full blur-3xl'></div>
				<div className='absolute -bottom-1/2 -left-1/2 w-full h-full bg-emerald-500/5 rounded-full blur-3xl'></div>
			</div>

			{/* Auth Card */}
			<Card className='relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8'>
				{/* Logo/Header */}
				<div className='flex flex-col items-center mb-8'>
					<div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25'>
						<TrendingUp className='w-8 h-8 text-white' />
					</div>
					<h1 className='text-3xl font-bold text-white mb-2'>Wager</h1>
					<p className='text-slate-400 text-center'>
						Track your pay, predict your earnings
					</p>
				</div>

				{/* Tab Switcher */}
				<div className='flex gap-2 p-1 bg-white/5 rounded-lg mb-6'>
					<button
						onClick={() => setIsLogin(true)}
						className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
							isLogin
								? 'bg-white text-slate-900 shadow-lg'
								: 'text-slate-300 hover:text-white cursor-pointer'
						}`}
					>
						Login
					</button>
					<button
						onClick={() => setIsLogin(false)}
						className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
							!isLogin
								? 'bg-white text-slate-900 shadow-lg'
								: 'text-slate-300 hover:text-white cursor-pointer'
						}`}
					>
						Sign Up
					</button>
				</div>

				{/* Form */}
				<form
					onSubmit={handleSubmit}
					className='space-y-4'
				>
					{/* Display Name - Animated */}
					<div
						className={`overflow-hidden transition-all duration-300 ease-in-out ${
							!isLogin ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
						}`}
					>
						<div className={!isLogin ? '' : 'invisible'}>
							<Label
								htmlFor='displayName'
								className='text-slate-200'
							>
								Display Name
							</Label>
							<Input
								id='displayName'
								type='text'
								placeholder='Ben'
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								className='mt-1.5 bg-white/5 border-white/10 text-white placeholder-slate-500
									focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-transparent'
								required={!isLogin}
							/>
						</div>
					</div>

					<div>
						<Label
							htmlFor='email'
							className='text-slate-200'
						>
							Email
						</Label>
						<Input
							id='email'
							type='email'
							placeholder='you@example.com'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='mt-1.5 bg-white/5 border-white/10 text-white placeholder-slate-500
								focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-transparent'
							required
						/>
					</div>

					<div>
						<Label
							htmlFor='password'
							className='text-slate-200'
						>
							Password
						</Label>
						<Input
							id='password'
							type='password'
							placeholder='••••••••'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className='mt-1.5 bg-white/5 border-white/10 text-white placeholder-slate-500
								focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:border-transparent'
							required
							minLength={6}
						/>
						{!isLogin && (
							<p className='text-xs text-slate-400 mt-1.5'>
								At least 6 characters
							</p>
						)}
					</div>

					{error && (
						<div className='p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
							<p className='text-sm text-red-400'>{error}</p>
						</div>
					)}

					<Button
						type='submit'
						disabled={loading}
						className='w-full bg-gradient-to-r from-blue-500 to-emerald-500
							hover:from-blue-600 hover:to-emerald-600
							text-white font-semibold py-6 rounded-lg
							shadow-lg shadow-blue-500/25
							transition-all transform hover:scale-[1.02] active:scale-[0.98]
							disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
					>
						{loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
					</Button>
				</form>

				{/* Footer */}
				<p className='text-center text-slate-400 text-sm mt-6'>
					Built for Amazon DSP couriers
				</p>
			</Card>
		</div>
	)
}
