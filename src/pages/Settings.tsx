import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { useAuth } from '@/hooks/useAuth'
import { fetchUserSettings } from '@/lib/api/settings'
import { supabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settingsStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useWeeksStore } from '@/store/weeksStore'
import { useVanStore } from '@/store/vanStore'
import type { InvoicingService } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'
import { RestartOnboardingDialog } from '@/components/settings/RestartOnboardingDialog'

/**
 * Settings form validation schema
 * Note: Form stores values in PENCE for easier validation/submission
 */
const settingsSchema = z.object({
	normalRate: z
		.number({ message: 'Normal rate is required' })
		.int('Rate must be a whole number')
		.min(0, 'Rate must be positive')
		.max(1000000, 'Rate too high'), // Max £10,000 (in pence)
	drsRate: z
		.number({ message: 'DRS rate is required' })
		.int('Rate must be a whole number')
		.min(0, 'Rate must be positive')
		.max(1000000, 'Rate too high'), // Max £10,000 (in pence)
	mileageRate: z
		.number({ message: 'Mileage rate is required' })
		.int('Rate must be a whole number')
		.min(0, 'Rate must be positive')
		.max(10000, 'Rate too high'), // Max £1 per mile (10000 = 100p/mile in storage format)
	invoicingService: z.enum(['Self-Invoicing', 'Verso-Basic', 'Verso-Full']),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export default function Settings() {
	const navigate = useNavigate()
	const { user } = useAuth()
	const { settings, isLoading, isSaving, setSettings, setSaving } =
		useSettingsStore()
	const { resetOnboarding } = useOnboardingStore()

	const [loadingSettings, setLoadingSettings] = useState(true)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [isRestartOnboardingOpen, setIsRestartOnboardingOpen] = useState(false)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<SettingsFormData>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			normalRate: 16000, // £160 in pence
			drsRate: 10000, // £100 in pence
			mileageRate: 1988, // 19.88p per mile (stored as pence per 100 miles)
			invoicingService: 'Self-Invoicing',
		},
	})

	/**
	 * Load settings from Supabase on mount
	 * Note: Settings are already loaded globally in AuthProvider,
	 * but we reload here to ensure form has latest values
	 */
	useEffect(() => {
		const loadSettings = async () => {
			if (!user?.id) return

			try {
				const data = await fetchUserSettings(user.id)
				setSettings(data)
				reset({
					normalRate: data.normal_rate,
					drsRate: data.drs_rate,
					mileageRate: data.mileage_rate,
					invoicingService: data.invoicing_service as InvoicingService,
				})
			} catch (err) {
				console.error('Error in loadSettings:', err)
				toast.error('Failed to load settings')
			} finally {
				setLoadingSettings(false)
			}
		}

		loadSettings()
	}, [user?.id, setSettings, reset])

	/**
	 * Save settings to Supabase
	 */
	const onSubmit = async (data: SettingsFormData) => {
		if (!user?.id) return

		setSaving(true)

		try {
			const { error } = await supabase
				.from('user_settings')
				.update({
					normal_rate: data.normalRate,
					drs_rate: data.drsRate,
					mileage_rate: data.mileageRate,
					invoicing_service: data.invoicingService,
				})
				.eq('user_id', user.id)

			if (error) {
				console.error('Error saving settings:', error)
				toast.error('Failed to save settings')
				return
			}

			// Update store with new values
			setSettings({
				user_id: user.id,
				normal_rate: data.normalRate,
				drs_rate: data.drsRate,
				mileage_rate: data.mileageRate,
				invoicing_service: data.invoicingService,
				created_at: settings?.created_at || new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})

			// Reset form to mark as clean
			reset(data)

			toast.success('Settings saved successfully!')
		} catch (err) {
			console.error('Error in onSubmit:', err)
			toast.error('Failed to save settings')
		} finally {
			setSaving(false)
		}
	}

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
				toast.error('Failed to delete data. Please try again.')
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
				toast.error('Failed to reset onboarding. Please try again.')
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
			toast.error('Failed to restart onboarding. Please try again.')
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

		toast.success('Starting guided tour with sample data')
	}

	/**
	 * Get invoicing service cost for display
	 */
	const getInvoicingCost = (service: InvoicingService): string => {
		switch (service) {
			case 'Self-Invoicing':
				return '£0'
			case 'Verso-Basic':
				return '£10'
			case 'Verso-Full':
				return '£30'
		}
	}

	/**
	 * Get invoicing service description
	 */
	const getInvoicingDescription = (service: InvoicingService): string => {
		switch (service) {
			case 'Self-Invoicing':
				return 'Handle your own invoicing and tax returns'
			case 'Verso-Basic':
				return 'Professional invoicing + public liability insurance (requires Ltd company)'
			case 'Verso-Full':
				return 'Full invoicing + accounting + tax returns + insurance (requires Ltd company)'
		}
	}

	if (isLoading || loadingSettings) {
		return (
			<div
				className='min-h-screen flex items-center justify-center'
				style={{
					background: `linear-gradient(to bottom right, var(--bg-page-from), var(--bg-page-via), var(--bg-page-to))`
				}}
			>
				<div className='flex items-center gap-2' style={{ color: 'var(--text-primary)' }}>
					<Loader2 className='w-6 h-6 animate-spin' />
					<p className='text-lg'>Loading settings...</p>
				</div>
			</div>
		)
	}

	return (
		<div className='p-4 md:p-8'>
			<div className='max-w-4xl mx-auto'>
				{/* Settings Form */}
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-6'
				>
					{/* Pay Rates Card */}
					<Card
						className='backdrop-blur-xl p-6'
						style={{
							backgroundColor: 'var(--bg-surface-primary)',
							borderColor: 'var(--border-primary)',
						}}
					>
						<h2 className='text-xl font-semibold mb-4' style={{ color: 'var(--text-primary)' }}>
							Pay Rates
						</h2>
						<p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
							Set your daily pay rates. These will be used to calculate your
							weekly earnings.
						</p>
						<p className='mb-6' style={{ color: 'var(--text-error)' }}>
							These should only be changed on the week that pay rates change.
						</p>

						<div className='space-y-4'>
							{/* Normal Route Rate */}
							<div>
								<Label
									htmlFor='normalRate'
									style={{ color: 'var(--input-label)' }}
								>
									Normal Route Rate
								</Label>
								<div className='mt-2 relative'>
									<span
										className='absolute left-4 top-1/2 -translate-y-1/2 font-mono z-10'
										style={{ color: 'var(--input-placeholder)' }}
									>
										£
									</span>
									<Controller
										name='normalRate'
										control={control}
										render={({ field }) => (
											<NumberInput
												id='normalRate'
												value={field.value / 100}
												onChange={(value) => field.onChange(value * 100)}
												min={0}
												max={10000}
												placeholder='160'
												className='pl-8 h-12 font-mono focus:ring-2 focus:ring-blue-500'
												style={{
													backgroundColor: 'var(--input-bg)',
													borderColor: 'var(--input-border)',
													color: 'var(--input-text)',
												}}
											/>
										)}
									/>
								</div>
								{errors.normalRate && (
									<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
										{errors.normalRate.message}
									</p>
								)}
								<p className='text-xs mt-1' style={{ color: 'var(--text-tertiary)' }}>
									Default: £160 per day
								</p>
							</div>

							{/* DRS Route Rate */}
							<div>
								<Label
									htmlFor='drsRate'
									style={{ color: 'var(--input-label)' }}
								>
									DRS/Missort Route Rate
								</Label>
								<div className='mt-2 relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 font-mono z-10' style={{ color: 'var(--input-placeholder)' }}>
										£
									</span>
									<Controller
										name='drsRate'
										control={control}
										render={({ field }) => (
											<NumberInput
												id='drsRate'
												value={field.value / 100}
												onChange={(value) => field.onChange(value * 100)}
												min={0}
												max={10000}
												placeholder='100'
												className='pl-8 h-12 font-mono focus:ring-2 focus:ring-blue-500' style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
											/>
										)}
									/>
								</div>
								{errors.drsRate && (
									<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
										{errors.drsRate.message}
									</p>
								)}
								<p className='text-xs mt-1' style={{ color: 'var(--text-tertiary)' }}>
									Default: £100 per day
								</p>
							</div>

							{/* Mileage Rate */}
							<div>
								<Label
									htmlFor='mileageRate'
									style={{ color: 'var(--input-label)' }}
								>
									Mileage Rate (per mile)
								</Label>
								<div className='mt-2 relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 font-mono z-10' style={{ color: 'var(--input-placeholder)' }}>
										£
									</span>
									<Controller
										name='mileageRate'
										control={control}
										render={({ field }) => (
											<NumberInput
												id='mileageRate'
												value={parseFloat((field.value / 10000).toFixed(4))}
												onChange={(value) => field.onChange(Math.round(value * 10000))}
												step={0.0001}
												min={0}
												max={1}
												placeholder='0.1988'
												className='pl-8 h-12 font-mono focus:ring-2 focus:ring-blue-500' style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }}
											/>
										)}
									/>
								</div>
								{errors.mileageRate && (
									<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
										{errors.mileageRate.message}
									</p>
								)}
								<p className='text-xs mt-1' style={{ color: 'var(--text-tertiary)' }}>
									Default: £0.1988/mile (19.88p). Amazon adjusts this based on
									fuel prices.
								</p>
							</div>

							{/* 6-Day Bonus Info */}
							<div className='mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg'>
								<p className='text-sm text-emerald-400'>
									<strong>6-Day Week Bonus:</strong> You automatically receive a
									flat £30 bonus when working exactly 6 days in a week (any
									route type combination).
								</p>
							</div>
						</div>
					</Card>

					{/* Invoicing Service Card */}
					<Card className='backdrop-blur-xl p-6' style={{ backgroundColor: 'var(--bg-surface-primary)', borderColor: 'var(--border-primary)' }}>
						<h2 className='text-xl font-semibold mb-4' style={{ color: 'var(--text-primary)' }}>
							Invoicing & Accounting
						</h2>
						<p className='text-sm mb-6' style={{ color: 'var(--text-secondary)' }}>
							Choose how you handle invoicing and tax returns. Costs are
							deducted from your weekly standard pay.
						</p>

						<div>
							<Label
								htmlFor='invoicingService'
								style={{ color: 'var(--input-label)' }}
							>
								Service Provider
							</Label>
							<Controller
								name='invoicingService'
								control={control}
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger
											id='invoicingService'
											style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--input-text)' }} className='focus:ring-2 focus:ring-blue-500 mt-2 cursor-pointer'
										>
											<SelectValue placeholder='Select invoicing service' />
										</SelectTrigger>
										<SelectContent style={{ backgroundColor: 'var(--modal-bg)', borderColor: 'var(--border-primary)' }} className=''>
											<SelectItem
												value='Self-Invoicing'
												style={{ color: 'var(--text-primary)' }} className='cursor-pointer hover:opacity-80'
											>
												Self-Invoicing (£0/week)
											</SelectItem>
											<SelectItem
												value='Verso-Basic'
												style={{ color: 'var(--text-primary)' }} className='cursor-pointer hover:opacity-80'
											>
												Verso Basic (£10/week)
											</SelectItem>
											<SelectItem
												value='Verso-Full'
												style={{ color: 'var(--text-primary)' }} className='cursor-pointer hover:opacity-80'
											>
												Verso Full (£30/week)
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.invoicingService && (
								<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
									{errors.invoicingService.message}
								</p>
							)}

							{/* Service Description */}
							<Controller
								name='invoicingService'
								control={control}
								render={({ field }) => (
									<div className='mt-4 p-4 rounded-lg' style={{ backgroundColor: 'var(--bg-surface-secondary)', borderColor: 'var(--border-secondary)' }}>
										<div className='flex items-center justify-between mb-2'>
											<span className='text-sm font-medium' style={{ color: 'var(--text-primary)' }}>
												{field.value.replace('-', ' ')}
											</span>
											<span className='text-sm font-mono font-semibold text-emerald-400'>
												{getInvoicingCost(field.value)}/week
											</span>
										</div>
										<p className='text-xs' style={{ color: 'var(--text-secondary)' }}>
											{getInvoicingDescription(field.value)}
										</p>
									</div>
								)}
							/>
						</div>
					</Card>

					{/* Onboarding Card */}
					<Card className='backdrop-blur-xl p-6' style={{ backgroundColor: 'var(--bg-surface-primary)', borderColor: 'var(--border-primary)' }}>
						<h2 className='text-xl font-semibold mb-4' style={{ color: 'var(--text-primary)' }}>Onboarding</h2>
						<p className='text-sm mb-4' style={{ color: 'var(--text-secondary)' }}>
							Restart the onboarding wizard to see the setup process again or take the sample data tour.
						</p>
						<Button
							type='button'
							onClick={() => setIsRestartOnboardingOpen(true)}
							variant='outline'
							style={{ backgroundColor: 'var(--button-secondary-bg)', borderColor: 'var(--button-secondary-border)', color: 'var(--button-secondary-text)' }} className='hover:opacity-90'
						>
							Restart Onboarding
						</Button>
					</Card>

					{/* Save Button */}
					<div className='flex items-center justify-end gap-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => navigate('/dashboard')}
							style={{ backgroundColor: 'var(--button-secondary-bg)', borderColor: 'var(--button-secondary-border)', color: 'var(--button-secondary-text)' }} className='hover:opacity-90'
						>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={!isDirty || isSaving}
							className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isSaving ? (
								<>
									<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									Saving...
								</>
							) : (
								<>
									<Save className='w-4 h-4 mr-2' />
									Save Settings
								</>
							)}
						</Button>
					</div>
				</form>

				{/* Danger Zone - Delete Account */}
				<Card className='bg-red-500/5 backdrop-blur-xl border-red-500/30 p-6 mt-8'>
					<h2 className='text-xl font-semibold text-red-400 mb-4'>Danger Zone</h2>
					<div className='space-y-4'>
						<div>
							<h3 className='text-lg font-medium text-red-300 mb-2'>
								Delete Account
							</h3>
							<p className='text-sm mb-4' style={{ color: 'var(--text-secondary)' }}>
								Permanently delete your account and all associated data. This action
								cannot be undone.
							</p>
						</div>
						<Button
							type='button'
							onClick={() => setIsDeleteModalOpen(true)}
							variant='outline'
							className='bg-red-600/10 border-red-500/50 text-red-400 hover:bg-red-600/20 hover:text-red-300 hover:border-red-500'
						>
							<Trash2 className='w-4 h-4 mr-2' />
							Delete My Account
						</Button>
					</div>
				</Card>

				{/* Delete Account Modal */}
				<DeleteAccountModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
				/>

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
