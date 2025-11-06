import { ArrowLeft, Plus, Truck, AlertCircle /*, Trash2*/ } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/hooks/useAuth'
import { fetchAllVanHires, recalculateAllDeposits, setManualDepositAdjustment } from '@/lib/api/vans'
import { useVanStore } from '@/store/vanStore'
import { formatCurrency } from '@/lib/calculations'
import type { VanHire } from '@/types/database'
// import { supabase } from '@/lib/supabase' // Commented out for beta testing

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VanHireModal } from '@/components/van/VanHireModal'
import { VanHireCard } from '@/components/van/VanHireCard'

export default function VanManagement() {
	const navigate = useNavigate()
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
				toast.error('Failed to load van hires', { duration: 3000 })
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
			toast.error('Please enter a deposit amount', { duration: 3000 })
			return
		}

		const amount = Math.round(parseFloat(depositAdjustment) * 100)
		if (amount < 0 || amount > 50000) {
			toast.error('Deposit must be between £0 and £500', { duration: 3000 })
			return
		}

		setIsAdjusting(true)
		try {
			const success = await setManualDepositAdjustment(user.id, amount)
			if (success) {
				// Reload vans to reflect the adjustment
				const vans = await fetchAllVanHires(user.id)
				if (vans) {
					setAllVans(vans)
				}
				toast.success('Deposit adjustment set successfully', { duration: 3000 })
				setShowDepositModal(false)
				setDepositAdjustment('')
			} else {
				toast.error('Failed to set deposit adjustment', { duration: 3000 })
			}
		} catch (error) {
			console.error('Error setting deposit:', error)
			toast.error('An error occurred', { duration: 3000 })
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
			<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
				<p className='text-white text-lg'>Loading van hires...</p>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
			<div className='container mx-auto px-4 py-8 max-w-6xl'>
				{/* Header */}
				<div className='flex items-center justify-between mb-8'>
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							size='icon'
							onClick={() => navigate('/dashboard')}
							className='text-white hover:bg-white/10'
						>
							<ArrowLeft className='w-5 h-5' />
						</Button>
						<div>
							<h1 className='text-xs sm:text-3xl font-bold text-white flex items-center gap-3'>
								<Truck className='w-8 h-8' />
								Van Management
							</h1>
							<p className='text-xs sm:text-lg text-slate-400 mt-1'>
								Track your van hires and deposits
							</p>
						</div>
					</div>
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
							className='text-xs sm:text-xl bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600'
							disabled={activeVan !== null}
						>
							<Plus className='w-4 h-4 mr-2' />
							New Van Hire
						</Button>
					</div>
				</div>

				{/* Deposit Summary Card */}
				<Card className='bg-white/10 backdrop-blur-xl border-white/20 p-6 mb-8'>
					<div className='flex items-start justify-between mb-4'>
						<div>
							<h2 className='text-xl font-semibold text-white mb-2'>
								Deposit Summary
							</h2>
							<p className='text-slate-400 text-sm'>
								Cumulative deposit across all van hires
							</p>
						</div>
						<div className='flex items-center gap-2'>
							{isDepositComplete ? (
								<Badge className='bg-emerald-500/20 text-emerald-400 border-emerald-500/30'>
									Complete
								</Badge>
							) : (
								<Badge className='bg-blue-500/20 text-blue-400 border-blue-500/30'>
									In Progress
								</Badge>
							)}
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowDepositModal(true)}
								className='border-white/20 text-white hover:bg-white/10 text-xs'
							>
								Set Deposit
							</Button>
						</div>
					</div>

					<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
						<div>
							<p className='text-slate-400 text-sm mb-1'>Total Paid</p>
							<p className='text-2xl font-mono font-bold text-white'>
								{formatCurrency(totalDepositPaid)}
							</p>
						</div>
						<div>
							<p className='text-slate-400 text-sm mb-1'>Remaining</p>
							<p className='text-2xl font-mono font-bold text-white'>
								{formatCurrency(depositRemaining)}
							</p>
						</div>
						<div>
							<p className='text-slate-400 text-sm mb-1'>Target</p>
							<p className='text-2xl font-mono font-bold text-slate-400'>
								£500.00
							</p>
						</div>
					</div>

					{/* Progress Bar */}
					<div className='mt-6'>
						<div className='w-full bg-white/10 rounded-full h-3 overflow-hidden'>
							<div
								className='bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500'
								style={{
									width: `${Math.min(100, (totalDepositPaid / 50000) * 100)}%`,
								}}
							/>
						</div>
					</div>
				</Card>

				{/* Active Van Alert */}
				{activeVan && (
					<Card className='bg-blue-500/10 backdrop-blur-xl border-blue-500/30 p-4 mb-6'>
						<div className='flex items-center gap-3'>
							<AlertCircle className='w-5 h-5 text-blue-400' />
							<div>
								<p className='text-blue-400 font-semibold'>
									You have an active van hire
								</p>
								<p className='text-blue-300 text-sm'>
									Off-hire your current van ({activeVan.registration}) before
									adding a new one
								</p>
							</div>
						</div>
					</Card>
				)}

				{/* Van Hires List */}
				<div className='space-y-4'>
					<h2 className='text-xl font-semibold text-white'>Van Hire History</h2>

					{allVans.filter(v => v.registration !== 'MANUAL_DEPOSIT_ADJUSTMENT').length === 0 ? (
						<Card className='bg-white/5 backdrop-blur-xl border-white/10 p-12'>
							<div className='text-center'>
								<Truck className='w-16 h-16 text-slate-600 mx-auto mb-4' />
								<p className='text-slate-400 text-lg mb-2'>No van hires yet</p>
								<p className='text-slate-500 text-sm mb-6'>
									Add your first van hire to start tracking costs and deposits
								</p>
								<Button
									onClick={handleNewVan}
									className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600'
								>
									<Plus className='w-4 h-4 mr-2' />
									Add Van Hire
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

			{/* Van Hire Modal */}
			{showHireModal && (
				<VanHireModal
					van={editingVan}
					onClose={handleCloseModal}
				/>
			)}

			{/* Manual Deposit Adjustment Modal */}
			{showDepositModal && (
				<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'>
					<Card className='bg-slate-900 border-white/20 max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-white mb-4'>Set Deposit Amount</h3>
						<p className='text-slate-400 mb-4'>
							If you've already paid some or all of your deposit before using this app,
							enter the total amount here to ensure accurate tracking.
						</p>

						<div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4'>
							<p className='text-yellow-400 text-sm font-semibold mb-1'>
								Important
							</p>
							<p className='text-yellow-300 text-xs'>
								This will override the automatically calculated deposit.
								Only use this if you started using the app after already paying part of your deposit.
							</p>
						</div>

						<Label htmlFor='deposit_amount' className='text-white'>
							Total Deposit Paid (£) *
						</Label>
						<Input
							id='deposit_amount'
							type='number'
							step='0.01'
							min='0'
							max='500'
							value={depositAdjustment}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAdjustment(e.target.value)}
							placeholder='e.g., 250.00'
							className='bg-white/5 border-white/20 text-white mt-2 mb-2'
						/>
						<p className='text-slate-400 text-xs mb-4'>
							Maximum: £500.00
						</p>

						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => {
									setShowDepositModal(false)
									setDepositAdjustment('')
								}}
								disabled={isAdjusting}
								className='border-white/20 text-white hover:bg-white/10'
							>
								Cancel
							</Button>
							<Button
								onClick={handleSetDeposit}
								disabled={isAdjusting}
								className='bg-gradient-to-r from-blue-500 to-emerald-500'
							>
								{isAdjusting ? 'Setting...' : 'Set Deposit'}
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	)
}
