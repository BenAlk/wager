import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useTranslation } from '@/i18n/useTranslation'
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
 * Note: mileageRate is excluded from settings - adjusted per-week in calendar
 */
const createSettingsSchema = (t: (key: string, params?: any) => string) =>
	z.object({
		normalRate: z
			.number({ message: t('validation:finance.normalRateRequired') })
			.int(t('validation:finance.rateWhole'))
			.min(0, t('validation:finance.ratePositive'))
			.max(1000000, t('validation:finance.rateTooHigh')),
		lwbRate: z
			.number({ message: t('validation:finance.lwbRateRequired') })
			.int(t('validation:finance.rateWhole'))
			.min(0, t('validation:finance.ratePositive'))
			.max(1000000, t('validation:finance.rateTooHigh')),
		drsRate: z
			.number({ message: t('validation:finance.drsRateRequired') })
			.int(t('validation:finance.rateWhole'))
			.min(0, t('validation:finance.ratePositive'))
			.max(1000000, t('validation:finance.rateTooHigh')),
		invoicingService: z.enum(['Self-Invoicing', 'Verso-Basic', 'Verso-Full']),
	})

type SettingsFormData = {
	normalRate: number
	lwbRate: number
	drsRate: number
	invoicingService: 'Self-Invoicing' | 'Verso-Basic' | 'Verso-Full'
}

export function FinanceSettings() {
	const { t } = useTranslation('settings')
	const { user } = useAuth()
	const { settings, isSaving, setSettings, setSaving } = useSettingsStore()

	const [loadingSettings, setLoadingSettings] = useState(true)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<SettingsFormData>({
		resolver: zodResolver(createSettingsSchema(t)),
		defaultValues: {
			normalRate: 15700, // £157 in pence
			lwbRate: 17100, // £171 in pence
			drsRate: 10000, // £100 in pence
			invoicingService: 'Self-Invoicing',
		},
	})

	/**
	 * Load settings from Supabase on mount
	 */
	useEffect(() => {
		const loadSettings = async () => {
			if (!user?.id) return

			try {
				const data = await fetchUserSettings(user.id)
				setSettings(data)
				reset({
					normalRate: data.normal_rate,
					lwbRate: data.lwb_rate,
					drsRate: data.drs_rate,
					invoicingService: data.invoicing_service as InvoicingService,
				})
			} catch (err) {
				console.error('Error in loadSettings:', err)
				toast.error(t('toast:settings.saveFailed'))
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
					lwb_rate: data.lwbRate,
					drs_rate: data.drsRate,
					invoicing_service: data.invoicingService,
				})
				.eq('user_id', user.id)

			if (error) {
				console.error('Error saving settings:', error)
				toast.error(t('toast:settings.saveFailed'))
				return
			}

			// Update store with new values (keep existing mileage_rate)
			setSettings({
				user_id: user.id,
				normal_rate: data.normalRate,
				lwb_rate: data.lwbRate,
				drs_rate: data.drsRate,
				mileage_rate: settings?.mileage_rate || 1988, // Preserve existing mileage rate
				invoicing_service: data.invoicingService,
				created_at: settings?.created_at || new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})

			// Reset form to mark as clean
			reset(data)

			toast.success(t('toast:settings.saved'))
		} catch (err) {
			console.error('Error in onSubmit:', err)
			toast.error(t('toast:settings.saveFailed'))
		} finally{
			setSaving(false)
		}
	}

	/**
	 * Get invoicing service cost for display
	 */
	const getInvoicingCost = (service: InvoicingService): string => {
		switch (service) {
			case 'Self-Invoicing':
				return t('finance.selfInvoicingCost')
			case 'Verso-Basic':
				return t('finance.versoBasicCost')
			case 'Verso-Full':
				return t('finance.versoFullCost')
		}
	}

	/**
	 * Get invoicing service description
	 */
	const getInvoicingDescription = (service: InvoicingService): string => {
		switch (service) {
			case 'Self-Invoicing':
				return t('finance.selfInvoicingDescription')
			case 'Verso-Basic':
				return t('finance.versoBasicDescription')
			case 'Verso-Full':
				return t('finance.versoFullDescription')
		}
	}

	if (loadingSettings) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='flex items-center gap-2' style={{ color: 'var(--text-primary)' }}>
					<Loader2 className='w-6 h-6 animate-spin' />
					<p className='text-lg'>{t('finance.loadingSettings')}</p>
				</div>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
			{/* Pay Rates Card */}
			<Card
				className='backdrop-blur-xl p-6'
				style={{
					backgroundColor: 'var(--bg-surface-primary)',
					borderColor: 'var(--border-primary)',
				}}
			>
				<h2 className='text-xl font-semibold mb-4' style={{ color: 'var(--text-primary)' }}>
					{t('finance.title')}
				</h2>
				<p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
					{t('finance.description')}
				</p>
				<p className='mb-6' style={{ color: 'var(--text-error)' }}>
					{t('finance.warning')}
				</p>

				<div className='space-y-4'>
					{/* Normal Route Rate */}
					<div>
						<Label htmlFor='normalRate' style={{ color: 'var(--input-label)' }}>
							{t('finance.normalRate')}
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
										placeholder='157'
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
							{t('finance.normalRateDefault')}
						</p>
					</div>

					{/* LWB Route Rate */}
					<div>
						<Label htmlFor='lwbRate' style={{ color: 'var(--input-label)' }}>
							{t('finance.lwbRate')}
						</Label>
						<div className='mt-2 relative'>
							<span
								className='absolute left-4 top-1/2 -translate-y-1/2 font-mono z-10'
								style={{ color: 'var(--input-placeholder)' }}
							>
								£
							</span>
							<Controller
								name='lwbRate'
								control={control}
								render={({ field }) => (
									<NumberInput
										id='lwbRate'
										value={field.value / 100}
										onChange={(value) => field.onChange(value * 100)}
										min={0}
										max={10000}
										placeholder='171'
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
						{errors.lwbRate && (
							<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
								{errors.lwbRate.message}
							</p>
						)}
						<p className='text-xs mt-1' style={{ color: 'var(--text-tertiary)' }}>
							{t('finance.lwbRateDefault')}
						</p>
					</div>

					{/* DRS Route Rate */}
					<div>
						<Label htmlFor='drsRate' style={{ color: 'var(--input-label)' }}>
							{t('finance.drsRate')}
						</Label>
						<div className='mt-2 relative'>
							<span
								className='absolute left-4 top-1/2 -translate-y-1/2 font-mono z-10'
								style={{ color: 'var(--input-placeholder)' }}
							>
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
						{errors.drsRate && (
							<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
								{errors.drsRate.message}
							</p>
						)}
						<p className='text-xs mt-1' style={{ color: 'var(--text-tertiary)' }}>
							{t('finance.drsRateDefault')}
						</p>
					</div>

					{/* 6-Day Bonus Info */}
					<div className='mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg'>
						<p className='text-sm text-emerald-400'>
							<strong>{t('finance.sixDayBonusTitle')}</strong> {t('finance.sixDayBonusDescription')}
						</p>
					</div>
				</div>
			</Card>

			{/* Invoicing Service Card */}
			<Card
				className='backdrop-blur-xl p-6'
				style={{
					backgroundColor: 'var(--bg-surface-primary)',
					borderColor: 'var(--border-primary)',
				}}
			>
				<h2 className='text-xl font-semibold mb-4' style={{ color: 'var(--text-primary)' }}>
					{t('finance.invoicingTitle')}
				</h2>
				<p className='text-sm mb-6' style={{ color: 'var(--text-secondary)' }}>
					{t('finance.invoicingDescription')}
				</p>

				<div>
					<Label htmlFor='invoicingService' style={{ color: 'var(--input-label)' }}>
						{t('finance.serviceProvider')}
					</Label>
					<Controller
						name='invoicingService'
						control={control}
						render={({ field }) => (
							<Select value={field.value} onValueChange={field.onChange}>
								<SelectTrigger
									id='invoicingService'
									style={{
										backgroundColor: 'var(--input-bg)',
										borderColor: 'var(--input-border)',
										color: 'var(--input-text)',
									}}
									className='focus:ring-2 focus:ring-blue-500 mt-2 cursor-pointer'
								>
									<SelectValue placeholder={t('finance.serviceProviderPlaceholder')} />
								</SelectTrigger>
								<SelectContent
									style={{
										backgroundColor: 'var(--modal-bg)',
										borderColor: 'var(--border-primary)',
									}}
								>
									<SelectItem
										value='Self-Invoicing'
										style={{ color: 'var(--text-primary)' }}
										className='cursor-pointer hover:opacity-80'
									>
										{t('domain:invoicingServices.SelfInvoicing')} ({t('finance.selfInvoicingCost')})
									</SelectItem>
									<SelectItem
										value='Verso-Basic'
										style={{ color: 'var(--text-primary)' }}
										className='cursor-pointer hover:opacity-80'
									>
										{t('domain:invoicingServices.VersoBasic')} ({t('finance.versoBasicCost')})
									</SelectItem>
									<SelectItem
										value='Verso-Full'
										style={{ color: 'var(--text-primary)' }}
										className='cursor-pointer hover:opacity-80'
									>
										{t('domain:invoicingServices.VersoFull')} ({t('finance.versoFullCost')})
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
							<div
								className='mt-4 p-4 rounded-lg'
								style={{
									backgroundColor: 'var(--bg-surface-secondary)',
									borderColor: 'var(--border-secondary)',
								}}
							>
								<div className='flex items-center justify-between mb-2'>
									<span
										className='text-sm font-medium'
										style={{ color: 'var(--text-primary)' }}
									>
										{field.value.replace('-', ' ')}
									</span>
									<span className='text-sm font-mono font-semibold text-emerald-400'>
										{getInvoicingCost(field.value)}
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

			{/* Save Button */}
			<div className='flex items-center justify-end'>
				<Button
					type='submit'
					disabled={!isDirty || isSaving}
					className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
				>
					{isSaving ? (
						<>
							<Loader2 className='w-4 h-4 mr-2 animate-spin' />
							{t('finance.savingButton')}
						</>
					) : (
						<>
							<Save className='w-4 h-4 mr-2' />
							{t('finance.saveButton')}
						</>
					)}
				</Button>
			</div>
		</form>
	)
}
