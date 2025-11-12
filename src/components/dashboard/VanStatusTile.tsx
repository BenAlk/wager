import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Truck, X } from 'lucide-react'
import { offHireVan, fetchAllVanHires } from '@/lib/api/vans'
import { useVanStore } from '@/store/vanStore'
import { useAuth } from '@/hooks/useAuth'
import type { VanHire } from '@/types/database'

import { DashboardTile } from './DashboardTile'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function VanStatusTile() {
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

	if (!displayVan) {
		return null
	}

	const depositProgress = (totalDepositPaid / 50000) * 100
	const isOffHired = !!displayVan.off_hire_date

	const handleOffHire = async () => {
		if (!activeVan || !offHireDateInput) {
			toast.error('Please enter an off-hire date', { duration: 3000 })
			return
		}

		setSaving(true)
		try {
			const offHireDate = new Date(offHireDateInput)
			const updated = await offHireVan(activeVan.id, offHireDate)
			if (updated) {
				updateVan(activeVan.id, updated)
				toast.success('Van off-hired successfully', { duration: 3000 })
				setShowOffHireModal(false)
				setLastVan(updated) // Update lastVan for display
			} else {
				toast.error('Failed to off-hire van', { duration: 3000 })
			}
		} catch (error) {
			console.error('Error off-hiring van:', error)
			toast.error('An error occurred', { duration: 3000 })
		} finally {
			setSaving(false)
		}
	}

	return (
		<>
			<DashboardTile title='Van Status' icon={Truck}>
				<div className='flex flex-col h-full'>
					<div className='space-y-4 flex-1'>
						<div>
							<div className='flex items-center justify-between mb-1'>
								<p className='text-[var(--text-secondary)] text-sm'>
									{isOffHired ? 'Last Van' : 'Current Van'}
								</p>
								{isOffHired && (
									<span className='text-xs text-[var(--text-warning)] bg-[var(--bg-warning)] px-2 py-1 rounded'>
										Off-Hired
									</span>
								)}
							</div>
							<p className='text-[var(--text-primary)] font-bold text-lg'>
								{displayVan.registration}
							</p>
							<p className='text-[var(--text-secondary)] text-xs'>
								{displayVan.van_type} - £{(displayVan.weekly_rate / 100).toFixed(0)}
								/week
							</p>
							{isOffHired && displayVan.off_hire_date && (
								<p className='text-[var(--text-tertiary)] text-xs mt-1'>
									Off-hired: {new Date(displayVan.off_hire_date).toLocaleDateString()}
								</p>
							)}
						</div>

						<div>
							<div className='flex items-center justify-between mb-2'>
								<p className='text-[var(--text-secondary)] text-sm'>Deposit Progress</p>
								<p className='text-[var(--text-primary)] text-sm font-mono'>
									£{(totalDepositPaid / 100).toFixed(2)} / £500
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
							Off-Hire Van
						</Button>
					)}
				</div>
			</DashboardTile>

			{/* Off-Hire Modal */}
			{showOffHireModal && (
				<div className='fixed inset-0 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4'>
					<Card className='bg-[var(--modal-bg)] border-[var(--modal-border)] max-w-md w-full p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-xl font-bold text-[var(--text-primary)]'>Off-Hire Van</h3>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setShowOffHireModal(false)}
								className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
							>
								<X className='w-5 h-5' />
							</Button>
						</div>

						<p className='text-[var(--text-secondary)] mb-4'>
							Enter the date when the van was returned. The deposit will be held
							for 6 weeks.
						</p>

						<div className='bg-[var(--bg-info)] border border-[var(--border-info)] rounded-lg p-3 mb-4'>
							<p className='text-[var(--text-info)] text-sm font-semibold mb-1'>
								Important: Same-Day Van Swaps
							</p>
							<p className='text-[var(--text-info)]/80 text-xs'>
								The off-hire date is the <strong>last day</strong> you had the
								van. If you're picking up a new van the same morning you're
								returning this one, off-hire this van on the{' '}
								<strong>previous day</strong> to avoid counting the same day
								twice.
							</p>
						</div>

						<div className='space-y-4'>
							<div>
								<Label htmlFor='off_hire_date' className='text-[var(--input-label)]'>
									Off-Hire Date *
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
									Cancel
								</Button>
								<Button
									onClick={handleOffHire}
									className='h-10 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)]'
								>
									Confirm Off-Hire
								</Button>
							</div>
						</div>
					</Card>
				</div>
			)}
		</>
	)
}
