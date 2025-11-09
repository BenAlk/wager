import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import * as z from 'zod'

import { useAuth } from '@/hooks/useAuth'
import { fetchUserSettings } from '@/lib/api/settings'
import { supabase } from '@/lib/supabase'
import { useSettingsStore } from '@/store/settingsStore'
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

	const [loadingSettings, setLoadingSettings] = useState(true)

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
			<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
				<div className='flex items-center gap-2 text-white'>
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
					<Card className='bg-white/10 backdrop-blur-xl border-white/20 p-6'>
						<h2 className='text-xl font-semibold text-white mb-4'>Pay Rates</h2>
						<p className='text-sm text-slate-400'>
							Set your daily pay rates. These will be used to calculate your
							weekly earnings.
						</p>
						<p className='text-red-500 mb-6'>
							These should only be changed on the week that pay rates change.
						</p>

						<div className='space-y-4'>
							{/* Normal Route Rate */}
							<div>
								<Label
									htmlFor='normalRate'
									className='text-slate-200'
								>
									Normal Route Rate
								</Label>
								<div className='mt-2 relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono z-10'>
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
												className='bg-white/5 border-white/10 text-white pl-8 h-12 font-mono focus:ring-2 focus:ring-blue-500'
											/>
										)}
									/>
								</div>
								{errors.normalRate && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.normalRate.message}
									</p>
								)}
								<p className='text-xs text-slate-500 mt-1'>
									Default: £160 per day
								</p>
							</div>

							{/* DRS Route Rate */}
							<div>
								<Label
									htmlFor='drsRate'
									className='text-slate-200'
								>
									DRS/Missort Route Rate
								</Label>
								<div className='mt-2 relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono z-10'>
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
												className='bg-white/5 border-white/10 text-white pl-8 h-12 font-mono focus:ring-2 focus:ring-blue-500'
											/>
										)}
									/>
								</div>
								{errors.drsRate && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.drsRate.message}
									</p>
								)}
								<p className='text-xs text-slate-500 mt-1'>
									Default: £100 per day
								</p>
							</div>

							{/* Mileage Rate */}
							<div>
								<Label
									htmlFor='mileageRate'
									className='text-slate-200'
								>
									Mileage Rate (per mile)
								</Label>
								<div className='mt-2 relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono z-10'>
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
												className='bg-white/5 border-white/10 text-white pl-8 h-12 font-mono focus:ring-2 focus:ring-blue-500'
											/>
										)}
									/>
								</div>
								{errors.mileageRate && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.mileageRate.message}
									</p>
								)}
								<p className='text-xs text-slate-500 mt-1'>
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
					<Card className='bg-white/10 backdrop-blur-xl border-white/20 p-6'>
						<h2 className='text-xl font-semibold text-white mb-4'>
							Invoicing & Accounting
						</h2>
						<p className='text-sm text-slate-400 mb-6'>
							Choose how you handle invoicing and tax returns. Costs are
							deducted from your weekly standard pay.
						</p>

						<div>
							<Label
								htmlFor='invoicingService'
								className='text-slate-200'
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
											className='bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-blue-500 mt-2 cursor-pointer'
										>
											<SelectValue placeholder='Select invoicing service' />
										</SelectTrigger>
										<SelectContent className='bg-slate-800 border-white/10'>
											<SelectItem
												value='Self-Invoicing'
												className='text-white cursor-pointer hover:bg-white/5'
											>
												Self-Invoicing (£0/week)
											</SelectItem>
											<SelectItem
												value='Verso-Basic'
												className='text-white cursor-pointer hover:bg-white/5'
											>
												Verso Basic (£10/week)
											</SelectItem>
											<SelectItem
												value='Verso-Full'
												className='text-white cursor-pointer hover:bg-white/5'
											>
												Verso Full (£30/week)
											</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
							{errors.invoicingService && (
								<p className='text-red-400 text-sm mt-1'>
									{errors.invoicingService.message}
								</p>
							)}

							{/* Service Description */}
							<Controller
								name='invoicingService'
								control={control}
								render={({ field }) => (
									<div className='mt-4 p-4 bg-white/5 border border-white/10 rounded-lg'>
										<div className='flex items-center justify-between mb-2'>
											<span className='text-sm font-medium text-slate-200'>
												{field.value.replace('-', ' ')}
											</span>
											<span className='text-sm font-mono font-semibold text-emerald-400'>
												{getInvoicingCost(field.value)}/week
											</span>
										</div>
										<p className='text-xs text-slate-400'>
											{getInvoicingDescription(field.value)}
										</p>
									</div>
								)}
							/>
						</div>
					</Card>

					{/* Save Button */}
					<div className='flex items-center justify-end gap-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => navigate('/dashboard')}
							className='bg-white/5 border-white/10 text-white hover:bg-white/10'
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
			</div>
		</div>
	)
}
