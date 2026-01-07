import { Plus, Truck, AlertCircle /*, Trash2*/ } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/useTranslation'
import { fetchAllVanHires, recalculateAllDeposits, setManualDepositAdjustment, clearManualDepositAdjustment } from '@/lib/api/vans'
import { useVanStore } from '@/store/vanStore'
import { formatCurrency } from '@/lib/calculations'
import type { VanHire } from '@/types/database'
// import { supabase } from '@/lib/supabase' // Commented out for beta testing

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { VanHireModal } from '@/components/van/VanHireModal'
import { VanHireCard } from '@/components/van/VanHireCard'

export default function VanManagement() {
	const { t } = useTranslation('vanManagement')
	const { user } = useAuth()
	const {
		allVans,
		activeVan,
		totalDepositPaid,
		isLoading,
		setAllVans,
		setLoading,
	} = useVanStore()

	const [showHireModal, setShowHireModal] = useState(false)
	const [editingVan, setEditingVan] = useState<VanHire | null>(null)
	const [showDepositModal, setShowDepositModal] = useState(false)
	const [depositAdjustment, setDepositAdjustment] = useState('')
	const [isAdjusting, setIsAdjusting] = useState(false)
	// const [isDeleting, setIsDeleting] = useState(false) // Commented out for beta testing

	/**
	 * Load all van hires on mount and recalculate deposits
	 */
	useEffect(() => {
		const loadVans = async () => {
			if (!user?.id) return

			setLoading(true)

			// Recalculate all deposits based on chronological van hire history
			await recalculateAllDeposits(user.id)

			// Fetch updated vans with recalculated deposits
			const vans = await fetchAllVanHires(user.id)
			if (vans) {
				setAllVans(vans)
			} else {
				toast.error(t('toast:van.loadFailed'), { duration: 3000 })
			}
		}

		loadVans()
	}, [user?.id, setAllVans, setLoading])

	const depositRemaining = Math.max(0, 50000 - totalDepositPaid)
	const isDepositComplete = totalDepositPaid >= 50000

	const handleNewVan = () => {
		setEditingVan(null)
		setShowHireModal(true)
	}

	const handleEditVan = (van: VanHire) => {
		setEditingVan(van)
		setShowHireModal(true)
	}

	const handleCloseModal = async () => {
		setShowHireModal(false)
		setEditingVan(null)

		// Recalculate deposits after any changes
		if (user?.id) {
			await recalculateAllDeposits(user.id)
			const vans = await fetchAllVanHires(user.id)
			if (vans) {
				setAllVans(vans)
			}
		}
	}

	const handleSetDeposit = async () => {
		if (!user?.id || !depositAdjustment) {
			toast.error(t('toast:van.enterDeposit'), { duration: 3000 })
			return
		}

		const amount = Math.round(parseFloat(depositAdjustment) * 100)
		if (amount < 0 || amount > 50000) {
			toast.error(t('toast:van.depositRange'), { duration: 3000 })
			return
		}

		setIsAdjusting(true)
		try {
			const success = await setManualDepositAdjustment(user.id, amount)
			if (success) {
				// Recalculate deposits with the new manual amount
				await recalculateAllDeposits(user.id)
				// Reload vans to reflect the adjustment
				const vans = await fetchAllVanHires(user.id)
				if (vans) {
					setAllVans(vans)
				}
				toast.success(t('toast:van.manualDepositSet'), { duration: 3000 })
				setShowDepositModal(false)
				setDepositAdjustment('')
			} else {
				toast.error(t('toast:van.depositAdjustFailed'), { duration: 3000 })
			}
		} catch (error) {
			console.error('Error setting deposit:', error)
			toast.error(t('toast:general.error'), { duration: 3000 })
		} finally {
			setIsAdjusting(false)
		}
	}

	const handleClearDeposit = async () => {
		if (!user?.id) return

		setIsAdjusting(true)
		try {
			const success = await clearManualDepositAdjustment(user.id)
			if (success) {
				// Recalculate deposits without manual adjustment
				await recalculateAllDeposits(user.id)
				// Reload vans to reflect the changes
				const vans = await fetchAllVanHires(user.id)
				if (vans) {
					setAllVans(vans)
				}
				toast.success(t('toast:van.manualDepositCleared'), { duration: 3000 })
				setShowDepositModal(false)
				setDepositAdjustment('')
			} else {
				toast.error(t('toast:van.depositClearFailed'), { duration: 3000 })
			}
		} catch (error) {
			console.error('Error clearing deposit:', error)
			toast.error(t('toast:general.error'), { duration: 3000 })
		} finally {
			setIsAdjusting(false)
		}
	}

	// DEBUG ONLY: Delete all van data for current user - COMMENTED OUT FOR BETA TESTING
	/* const handleDeleteAllVans = async () => {
		if (!user?.id) return

		const confirmed = window.confirm(
			'🚨 DEBUG ONLY 🚨\n\nThis will DELETE ALL van hire data for your account.\n\nAre you sure you want to continue?'
		)
		if (!confirmed) return

		setIsDeleting(true)
		try {
			const { error } = await supabase
				.from('van_hires')
				.delete()
				.eq('user_id', user.id)

			if (error) throw error

			// Clear store
			setAllVans([])
			toast.success('All van data deleted', { duration: 3000 })
		} catch (error) {
			console.error('Error deleting van data:', error)
			toast.error('Failed to delete van data', { duration: 3000 })
		} finally {
			setIsDeleting(false)
		}
	} */

	if (isLoading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-[var(--bg-page-from)] via-[var(--bg-page-via)] to-[var(--bg-page-to)] flex items-center justify-center'>
				<p className='text-[var(--text-primary)] text-lg'>{t('loading')}</p>
			</div>
		)
	}

	return (
		<div>
			<div className='container mx-auto px-4 py-8 max-w-6xl'>
				<h1 className='sr-only'>{t('pageTitle')}</h1>
				{/* Top Section: Add Van & Deposit Tracking */}
				<div data-tour='van-management-top'>
				{/* Actions Bar */}
				<div className='flex items-center justify-end mb-8'>
					<div className='flex gap-2'>
						{/* DEBUG ONLY: Delete all vans button - COMMENTED OUT FOR BETA TESTING */}
						{/* <Button
							onClick={handleDeleteAllVans}
							disabled={isDeleting || allVans.length === 0}
							variant='outline'
							className='border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300'
						>
							<Trash2 className='w-4 h-4 mr-2' />
							{isDeleting ? 'Deleting...' : '🚨 DEBUG: Delete All'}
						</Button> */}
						<Button
							onClick={handleNewVan}
							className='text-xs sm:text-xl bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)]'
							disabled={activeVan !== null}
						>
							<Plus className='w-4 h-4 mr-2' />
							{t('actions.newVanHire')}
						</Button>
					</div>
				</div>

				{/* Deposit Summary Card */}
				<Card className='bg-[var(--bg-surface-primary)] backdrop-blur-xl border-[var(--border-primary)] p-6 mb-8'>
					<div className='flex items-start justify-between mb-4'>
						<div>
							<h2 className='text-xl font-semibold text-[var(--text-primary)] mb-2'>
								{t('depositSummary.title')}
							</h2>
							<p className='text-[var(--text-secondary)] text-sm'>
								{t('depositSummary.subtitle')}
							</p>
						</div>
						<div className='flex items-center gap-2'>
							{isDepositComplete ? (
								<Badge className='bg-[var(--bg-success)] text-[var(--text-success)] border-[var(--border-success)]'>
									{t('depositSummary.complete')}
								</Badge>
							) : totalDepositPaid > 0 ? (
								<Badge className='bg-[var(--bg-info)] text-[var(--text-info)] border-[var(--border-info)]'>
									{t('depositSummary.inProgress')}
								</Badge>
							) : null}
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowDepositModal(true)}
								className='border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] text-xs'
							>
								{t('actions.setDeposit')}
							</Button>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div>
							<p className='text-[var(--text-secondary)] text-sm mb-1'>{t('depositSummary.totalPaid')}</p>
							<p className='text-2xl font-mono font-bold text-[var(--text-primary)]'>
								{formatCurrency(totalDepositPaid)}
							</p>
						</div>
						<div>
							<p className='text-[var(--text-secondary)] text-sm mb-1'>{t('depositSummary.remaining')}</p>
							<p className='text-2xl font-mono font-bold text-[var(--text-primary)]'>
								{formatCurrency(depositRemaining)}
							</p>
						</div>
						<div>
							<p className='text-[var(--text-secondary)] text-sm mb-1'>{t('depositSummary.target')}</p>
							<p className='text-2xl font-mono font-bold text-[var(--text-secondary)]'>
								£500.00
							</p>
						</div>
					</div>

					{/* Progress Bar */}
					<div className='mt-6'>
						<div className='w-full bg-[var(--bg-surface-tertiary)] rounded-full h-3 overflow-hidden'>
							<div
								className='bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] h-full transition-all duration-500'
								style={{
									width: `${Math.min(100, (totalDepositPaid / 50000) * 100)}%`,
								}}
							/>
						</div>
					</div>
				</Card>
				</div>
				{/* End Top Section */}

				{/* Bottom Section: Van History */}
				<div data-tour='van-management-bottom'>
				{/* Active Van Alert */}
				{activeVan && (
					<Card className='bg-[var(--bg-info)] backdrop-blur-xl border-[var(--border-info)] p-4 mb-6'>
						<div className='flex items-center gap-3'>
							<AlertCircle className='w-5 h-5 text-[var(--text-info)]' />
							<div>
								<p className='text-[var(--text-info)] font-semibold'>
									{t('activeVanAlert.title')}
								</p>
								<p className='text-[var(--text-info)]/80 text-sm'>
									{t('activeVanAlert.subtitle', { registration: activeVan.registration })}
								</p>
							</div>
						</div>
					</Card>
				)}

				{/* Van Hires List */}
				<div className='space-y-4'>
					<h2 className='text-xl font-semibold text-[var(--text-primary)]'>{t('history.title')}</h2>

					{allVans.filter(v => v.registration !== 'MANUAL_DEPOSIT_ADJUSTMENT').length === 0 ? (
						<Card className='bg-[var(--bg-surface-secondary)] backdrop-blur-xl border-[var(--border-secondary)] p-12'>
							<div className='text-center'>
								<Truck className='w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4' />
								<p className='text-[var(--text-secondary)] text-lg mb-2'>{t('history.empty.title')}</p>
								<p className='text-[var(--text-tertiary)] text-sm mb-6'>
									{t('history.empty.subtitle')}
								</p>
								<Button
									onClick={handleNewVan}
									className='bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)]'
								>
									<Plus className='w-4 h-4 mr-2' />
									{t('actions.addVanHire')}
								</Button>
							</div>
						</Card>
					) : (
						<div className='space-y-4'>
							{allVans
								.filter(v => v.registration !== 'MANUAL_DEPOSIT_ADJUSTMENT')
								.map((van) => (
									<VanHireCard
										key={van.id}
										van={van}
										onEdit={handleEditVan}
										isActive={van.id === activeVan?.id}
									/>
								))}
						</div>
					)}
				</div>
				</div>
				{/* End Bottom Section */}
			</div>

			{/* Van Hire Modal */}
			{showHireModal && (
				<VanHireModal
					van={editingVan}
					onClose={handleCloseModal}
				/>
			)}

			{/* Manual Deposit Adjustment Modal */}
			{showDepositModal && (
				<div className='fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-50 p-4'>
					<Card className='bg-[var(--modal-bg)] border-[var(--modal-border)] max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-[var(--text-primary)] mb-4'>{t('depositModal.title')}</h3>

						<div className='bg-[var(--bg-info)] border border-[var(--border-info)] rounded-lg p-4 mb-4'>
							<p className='text-[var(--text-info)] text-sm font-semibold mb-2'>
								{t('depositModal.infoTitle')}
							</p>
							<p className='text-[var(--text-info)]/80 text-sm leading-relaxed'>
								{t('depositModal.infoText')}
							</p>
							<p className='text-[var(--text-info)]/90 text-xs mt-2'>
								{t('depositModal.depositLimit')}
							</p>
						</div>

						<Label htmlFor='deposit_amount' className='text-[var(--input-label)]'>
							{t('depositModal.label')}
						</Label>
						<NumberInput
							id='deposit_amount'
							value={depositAdjustment ? parseFloat(depositAdjustment) : null}
							onChange={(value) => setDepositAdjustment(value.toString())}
							min={0}
							max={500}
							chevronSize='sm'
							placeholder={t('depositModal.placeholder')}
							className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-2 mb-2'
						/>
						<p className='text-[var(--text-secondary)] text-xs mb-4'>
							{t('depositModal.maximum')}
						</p>

						<div className='flex flex-col sm:flex-row gap-2'>
							<Button
								variant='outline'
								onClick={handleClearDeposit}
								disabled={isAdjusting || totalDepositPaid === 0}
								className='border-[var(--border-error)] text-[var(--text-error)] hover:bg-[var(--bg-error)]'
							>
								{t('actions.clearDeposits')}
							</Button>
							<div className='flex gap-2 flex-1 justify-end'>
								<Button
									variant='outline'
									onClick={() => {
										setShowDepositModal(false)
										setDepositAdjustment('')
									}}
									disabled={isAdjusting}
									className='border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
								>
									{t('common:actions.cancel')}
								</Button>
								<Button
									onClick={handleSetDeposit}
									disabled={isAdjusting}
									className='bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)]'
								>
									{isAdjusting ? t('depositModal.buttonSetting') : t('depositModal.buttonSet')}
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}
		</div>
	)
}
