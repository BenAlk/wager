import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useTranslation } from '@/i18n/useTranslation'
import { useAuth } from '@/hooks/useAuth'
import { useSettingsStore } from '@/store/settingsStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useWeeksStore } from '@/store/weeksStore'
import { useVanStore } from '@/store/vanStore'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinanceSettings } from '@/components/settings/FinanceSettings'
import { UserDetailsSettings } from '@/components/settings/UserDetailsSettings'
import { RestartOnboardingDialog } from '@/components/settings/RestartOnboardingDialog'
import { LanguageSettings } from '@/components/settings/LanguageSettings'

export default function Settings() {
	const { t } = useTranslation('settings')
	const navigate = useNavigate()
	const { user } = useAuth()
	const { isLoading } = useSettingsStore()
	const { resetOnboarding } = useOnboardingStore()

	const [isRestartOnboardingOpen, setIsRestartOnboardingOpen] = useState(false)

	/**
	 * Handle full onboarding - delete all data and restart
	 */
	const handleFullOnboarding = async () => {
		if (!user?.id) return

		try {
			// Delete all user data
			const { error: weeksError } = await supabase
				.from('weeks')
				.delete()
				.eq('user_id', user.id)

			const { error: vansError } = await supabase
				.from('van_hires')
				.delete()
				.eq('user_id', user.id)

			if (weeksError || vansError) {
				console.error('Error deleting data:', weeksError || vansError)
				toast.error(t('toast:general.deleteAllFailed'))
				return
			}

			// Reset onboarding status in database
			const { error: onboardingError } = await supabase
				.from('users')
				.update({
					onboarding_completed: false,
					onboarding_completed_at: null,
				})
				.eq('id', user.id)

			if (onboardingError) {
				console.error('Error resetting onboarding:', onboardingError)
				toast.error(t('toast:onboarding.resetFailed'))
				return
			}

			// Clear all cached data from stores
			const { clearCache: clearWeeksCache } = useWeeksStore.getState()
			const { setActiveVan } = useVanStore.getState()

			clearWeeksCache()
			setActiveVan(null)

			// Close dialog
			setIsRestartOnboardingOpen(false)

			// Reset onboarding state in localStorage
			resetOnboarding()

			// Use full page refresh to ensure all state is cleared
			// This will navigate to dashboard and start onboarding
			window.location.href = '/dashboard'

			// The onboarding will auto-start because onboarding_completed is now false in DB
		} catch (error) {
			console.error('Error in handleFullOnboarding:', error)
			toast.error(t('toast:onboarding.restartFailed'))
		}
	}

	/**
	 * Handle tour only - just start the guided tour
	 */
	const handleTourOnly = () => {
		// Close dialog
		setIsRestartOnboardingOpen(false)

		// Navigate to dashboard
		navigate('/dashboard')

		// Start guided tour after navigation
		setTimeout(() => {
			const { startGuidedTour } = useOnboardingStore.getState()
			startGuidedTour()
		}, 300)
	}

	if (isLoading) {
		return (
			<div
				className='min-h-screen flex items-center justify-center'
				style={{
					background: `linear-gradient(to bottom right, var(--bg-page-from), var(--bg-page-via), var(--bg-page-to))`,
				}}
			>
				<div className='flex items-center gap-2' style={{ color: 'var(--text-primary)' }}>
					<Loader2 className='w-6 h-6 animate-spin' />
					<p className='text-lg'>{t('common:loading')}</p>
				</div>
			</div>
		)
	}

	return (
		<div className='p-4 md:p-8'>
			<div className='max-w-4xl mx-auto'>
				<Tabs defaultValue='finance' className='space-y-6'>
					{/* Tab Navigation */}
					<TabsList
						className='grid w-full grid-cols-3 h-12 p-1 rounded-lg border'
						style={{
							backgroundColor: 'var(--bg-surface-secondary)',
							borderColor: 'var(--border-primary)',
						}}
					>
						<TabsTrigger
							value='finance'
							className='cursor-pointer h-full rounded-md font-medium transition-all data-[state=active]:shadow-sm'
							style={
								{
									'--tw-ring-offset-color': 'var(--bg-surface-secondary)',
								} as React.CSSProperties
							}
						>
							<span className='tab-trigger-text'>{t('tabs.finance')}</span>
						</TabsTrigger>
						<TabsTrigger
							value='user'
							className='cursor-pointer h-full rounded-md font-medium transition-all data-[state=active]:shadow-sm'
							style={
								{
									'--tw-ring-offset-color': 'var(--bg-surface-secondary)',
								} as React.CSSProperties
							}
						>
							<span className='tab-trigger-text'>{t('tabs.user')}</span>
						</TabsTrigger>
						<TabsTrigger
							value='language'
							className='cursor-pointer h-full rounded-md font-medium transition-all data-[state=active]:shadow-sm'
							style={
								{
									'--tw-ring-offset-color': 'var(--bg-surface-secondary)',
								} as React.CSSProperties
							}
						>
							<span className='tab-trigger-text'>{t('tabs.language')}</span>
						</TabsTrigger>
					</TabsList>

					{/* Finance Settings Tab */}
					<TabsContent value='finance' className='space-y-6'>
						<FinanceSettings />

						{/* Onboarding Card */}
						<Card
							className='backdrop-blur-xl p-6'
							style={{
								backgroundColor: 'var(--bg-surface-primary)',
								borderColor: 'var(--border-primary)',
							}}
						>
							<h2
								className='text-xl font-semibold mb-4'
								style={{ color: 'var(--text-primary)' }}
							>
								{t('onboarding.title')}
							</h2>
							<p className='text-sm mb-4' style={{ color: 'var(--text-secondary)' }}>
								{t('onboarding.description')}
							</p>
							<Button
								type='button'
								onClick={() => setIsRestartOnboardingOpen(true)}
								variant='outline'
								style={{
									backgroundColor: 'var(--button-secondary-bg)',
									borderColor: 'var(--button-secondary-border)',
									color: 'var(--button-secondary-text)',
								}}
								className='hover:opacity-90'
							>
								{t('onboarding.restartButton')}
							</Button>
						</Card>

						{/* Back to Dashboard Button */}
						<div className='flex items-center justify-end'>
							<Button
								type='button'
								variant='outline'
								onClick={() => navigate('/dashboard')}
								style={{
									backgroundColor: 'var(--button-secondary-bg)',
									borderColor: 'var(--button-secondary-border)',
									color: 'var(--button-secondary-text)',
								}}
								className='hover:opacity-90'
							>
								{t('common:actions.back')}
							</Button>
						</div>
					</TabsContent>

					{/* User Details Tab */}
					<TabsContent value='user' className='space-y-6'>
						<UserDetailsSettings />

						{/* Back to Dashboard Button */}
						<div className='flex items-center justify-end'>
							<Button
								type='button'
								variant='outline'
								onClick={() => navigate('/dashboard')}
								style={{
									backgroundColor: 'var(--button-secondary-bg)',
									borderColor: 'var(--button-secondary-border)',
									color: 'var(--button-secondary-text)',
								}}
								className='hover:opacity-90'
							>
								{t('common:actions.back')}
							</Button>
						</div>
					</TabsContent>

					{/* Language Tab */}
					<TabsContent value='language' className='space-y-6'>
						<LanguageSettings />

						{/* Back to Dashboard Button */}
						<div className='flex items-center justify-end'>
							<Button
								type='button'
								variant='outline'
								onClick={() => navigate('/dashboard')}
								style={{
									backgroundColor: 'var(--button-secondary-bg)',
									borderColor: 'var(--button-secondary-border)',
									color: 'var(--button-secondary-text)',
								}}
								className='hover:opacity-90'
							>
								{t('common:actions.back')}
							</Button>
						</div>
					</TabsContent>
				</Tabs>

				{/* Restart Onboarding Dialog */}
				<RestartOnboardingDialog
					isOpen={isRestartOnboardingOpen}
					onClose={() => setIsRestartOnboardingOpen(false)}
					onFullOnboarding={handleFullOnboarding}
					onTourOnly={handleTourOnly}
				/>
			</div>
		</div>
	)
}
