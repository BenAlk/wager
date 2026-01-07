import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Truck, X } from 'lucide-react'
import { offHireVan, fetchAllVanHires } from '@/lib/api/vans'
import { useVanStore } from '@/store/vanStore'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/useTranslation'
import type { VanHire } from '@/types/database'

import { DashboardTile } from './DashboardTile'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function VanStatusTile() {
	const { t } = useTranslation('dashboard')
	const { user } = useAuth()
	const { activeVan, updateVan, setSaving, totalDepositPaid } = useVanStore()
	const [showOffHireModal, setShowOffHireModal] = useState(false)
	const [offHireDateInput, setOffHireDateInput] = useState('')
	const [lastVan, setLastVan] = useState<VanHire | null>(null)

	// Fetch last van hire if no active van
	useEffect(() => {
		const fetchLastVan = async () => {
			if (!user?.id || activeVan) return

			const allVans = await fetchAllVanHires(user.id)
			if (allVans && allVans.length > 0) {
				// Filter out manual deposit adjustments and get most recent
				const realVans = allVans.filter(
					(v) => v.registration !== 'MANUAL_DEPOSIT_ADJUSTMENT'
				)
				if (realVans.length > 0) {
					setLastVan(realVans[0]) // Already sorted by on_hire_date desc
				}
			}
		}

		fetchLastVan()
	}, [user?.id, activeVan])

	// Use activeVan if available, otherwise use lastVan
	const displayVan = activeVan || lastVan

	const depositPaid = totalDepositPaid
	const depositProgress = (depositPaid / 50000) * 100
	const isOffHired = displayVan ? !!displayVan.off_hire_date : false

	const handleOffHire = async () => {
		if (!activeVan || !offHireDateInput) {
			toast.error(t('toast:van.enterOffHireDate'), { duration: 3000 })
			return
		}

		setSaving(true)
		try {
			const offHireDate = new Date(offHireDateInput)
			const updated = await offHireVan(activeVan.id, offHireDate)
			if (updated) {
				updateVan(activeVan.id, updated)
				toast.success(t('toast:van.offHired'), { duration: 3000 })
				setShowOffHireModal(false)
				setLastVan(updated) // Update lastVan for display
			} else {
				toast.error(t('toast:van.offHireFailed'), { duration: 3000 })
			}
		} catch (error) {
			console.error('Error off-hiring van:', error)
			toast.error(t('toast:general.error'), { duration: 3000 })
		} finally {
			setSaving(false)
		}
	}

	return (
		<>
			<DashboardTile title={t('vanStatusTile.title')} icon={Truck} data-tour='van-status'>
				{!displayVan ? (
					<div className='flex flex-col items-center justify-center h-full py-8 text-center'>
						<Truck className='w-12 h-12 text-[var(--text-tertiary)] mb-3 opacity-40' />
						<p className='text-[var(--text-secondary)] text-sm mb-2'>{t('vanStatusTile.noVanOnHire')}</p>
						<p className='text-[var(--text-tertiary)] text-xs'>
							{t('vanStatusTile.visitVanManagement')}
						</p>
					</div>
				) : (
					<div className='flex flex-col h-full'>
						<div className='space-y-4 flex-1'>
							<div>
								<div className='flex items-center justify-between mb-1'>
									<p className='text-[var(--text-secondary)] text-sm'>
										{isOffHired ? t('vanStatusTile.lastVan') : t('vanStatusTile.currentVan')}
									</p>
									{isOffHired && (
										<span className='text-xs text-[var(--text-warning)] bg-[var(--bg-warning)] px-2 py-1 rounded'>
											{t('vanStatusTile.offHired')}
										</span>
									)}
								</div>
								<p className='text-[var(--text-primary)] font-bold text-lg'>
									{displayVan.registration}
								</p>
								<p className='text-[var(--text-secondary)] text-xs'>
									{displayVan.van_type} - {t('vanStatusTile.weeklyRate', { rate: (displayVan.weekly_rate / 100).toFixed(0) })}
								</p>
								{isOffHired && displayVan.off_hire_date && (
									<p className='text-[var(--text-tertiary)] text-xs mt-1'>
										{t('vanStatusTile.offHiredDate', { date: new Date(displayVan.off_hire_date).toLocaleDateString() })}
									</p>
								)}
							</div>

							<div>
								<div className='flex items-center justify-between mb-2'>
									<p className='text-[var(--text-secondary)] text-sm'>{t('vanStatusTile.depositProgress')}</p>
									<p className='text-[var(--text-primary)] text-sm font-mono'>
										{t('vanStatusTile.depositAmount', { paid: (totalDepositPaid / 100).toFixed(2) })}
									</p>
								</div>
								<div className='w-full bg-[var(--bg-surface-tertiary)] rounded-full h-2'>
									<div
										className='bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] h-2 rounded-full transition-all'
										style={{ width: `${Math.min(depositProgress, 100)}%` }}
									/>
								</div>
							</div>
						</div>

						{!isOffHired && (
							<Button
								onClick={() => setShowOffHireModal(true)}
								className='w-full h-10 mt-auto bg-gradient-to-r from-[var(--button-warning-from)] to-[var(--button-warning-to)] hover:from-[var(--button-warning-hover-from)] hover:to-[var(--button-warning-hover-to)] text-[var(--text-primary)]'
							>
								{t('vanStatusTile.offHireButton')}
							</Button>
						)}
					</div>
				)}
			</DashboardTile>

			{/* Off-Hire Modal */}
			{showOffHireModal && (
				<div className='fixed inset-0 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4'>
					<Card className='bg-[var(--modal-bg)] border-[var(--modal-border)] max-w-md w-full p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-xl font-bold text-[var(--text-primary)]'>{t('vanStatusTile.modalTitle')}</h3>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setShowOffHireModal(false)}
								className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
								aria-label={t('vanStatusTile.closeAriaLabel')}
							>
								<X className='w-5 h-5' aria-hidden='true' />
							</Button>
						</div>

						<p className='text-[var(--text-secondary)] mb-4'>
							{t('vanStatusTile.modalDescription')}
						</p>

						<div className='bg-[var(--bg-info)] border border-[var(--border-info)] rounded-lg p-3 mb-4'>
							<p className='text-[var(--text-info)] text-sm font-semibold mb-1'>
								{t('vanStatusTile.importantTitle')}
							</p>
							<p className='text-[var(--text-info)]/80 text-xs'>
								{t('vanStatusTile.importantDescription')}
							</p>
						</div>

						<div className='space-y-4'>
							<div>
								<Label htmlFor='off_hire_date' className='text-[var(--input-label)]'>
									{t('vanStatusTile.offHireDateLabel')}
								</Label>
								<Input
									id='off_hire_date'
									type='date'
									value={offHireDateInput}
									onChange={(e) => setOffHireDateInput(e.target.value)}
									lang='en-GB'
									className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-2'
								/>
							</div>

							<div className='flex gap-2 justify-end'>
								<Button
									type='button'
									variant='outline'
									onClick={() => setShowOffHireModal(false)}
									className='border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
								>
									{t('common:actions.cancel')}
								</Button>
								<Button
									onClick={handleOffHire}
									className='h-10 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)]'
								>
									{t('vanStatusTile.confirmButton')}
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}
		</>
	)
}
