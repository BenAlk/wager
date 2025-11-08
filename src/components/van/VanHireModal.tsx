import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useAuth } from '@/hooks/useAuth'
import {
	createVanHire,
	deleteVanHire,
	offHireVan,
	refundDeposit,
	updateVanHire,
} from '@/lib/api/vans'
import { useVanStore } from '@/store/vanStore'
import type { VanHire, VanType } from '@/types/database'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const vanHireSchema = z
	.object({
		registration: z
			.string()
			.min(1, 'Registration is required')
			.max(20, 'Registration too long')
			.transform((val) => val.toUpperCase().trim()),
		van_type: z.enum(['Fleet', 'Flexi']).nullable(),
		weekly_rate: z
			.number({ message: 'Weekly rate is required' })
			.int('Rate must be a whole number')
			.min(0, 'Rate must be positive')
			.max(100000, 'Rate too high'), // Max £1,000
		on_hire_date: z.string().min(1, 'On-hire date is required'),
		off_hire_date: z.string().optional().nullable(),
		notes: z.string().max(500, 'Notes too long').optional().nullable(),
	})
	.refine(
		(data) => {
			// If off_hire_date is provided, ensure it's not before on_hire_date
			if (data.off_hire_date && data.on_hire_date) {
				const onHire = new Date(data.on_hire_date)
				const offHire = new Date(data.off_hire_date)
				return offHire >= onHire
			}
			return true
		},
		{
			message: 'Off-hire date must be on or after on-hire date',
			path: ['off_hire_date'],
		}
	)

type VanHireFormData = z.infer<typeof vanHireSchema>

interface VanHireModalProps {
	van: VanHire | null
	onClose: () => void
}

export function VanHireModal({ van, onClose }: VanHireModalProps) {
	const { user } = useAuth()
	const {
		addVan,
		updateVan: updateVanStore,
		removeVan,
		setSaving,
	} = useVanStore()
	const [isDeleting, setIsDeleting] = useState(false)
	const [showOffHire, setShowOffHire] = useState(false)
	const [showRefund, setShowRefund] = useState(false)
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [offHireDateInput, setOffHireDateInput] = useState('')
	const [refundAmountInput, setRefundAmountInput] = useState('')

	const isEditMode = van !== null

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<VanHireFormData>({
		resolver: zodResolver(vanHireSchema),
		defaultValues: van
			? {
					registration: van.registration,
					van_type: van.van_type,
					weekly_rate: van.weekly_rate,
					on_hire_date: van.on_hire_date,
					off_hire_date: van.off_hire_date ?? undefined,
					notes: van.notes ?? undefined,
			  }
			: {
					registration: '',
					van_type: 'Fleet',
					weekly_rate: 25000, // £250 default
					on_hire_date: new Date().toISOString().split('T')[0],
					off_hire_date: undefined,
					notes: undefined,
			  },
	})

	const vanType = watch('van_type')

	// Update weekly rate based on van type selection
	useEffect(() => {
		if (!isEditMode && vanType === 'Fleet') {
			// Set default for Fleet
		} else if (!isEditMode && vanType === 'Flexi') {
			// Flexi can be £100-£250, default to £100
		}
	}, [vanType, isEditMode])

	const onSubmit = async (data: VanHireFormData) => {
		if (!user?.id) return

		setSaving(true)
		try {
			if (isEditMode && van) {
				// Update existing van hire
				const updated = await updateVanHire(van.id, data)
				if (updated) {
					updateVanStore(van.id, updated)
					toast.success('Van hire updated successfully', { duration: 3000 })
					onClose()
				} else {
					toast.error('Failed to update van hire', { duration: 3000 })
				}
			} else {
				// Create new van hire - deposit fields are auto-calculated by system
				const newVan = await createVanHire({
					...data,
					user_id: user.id,
					off_hire_date: data.off_hire_date || null,
					deposit_paid: 0, // System will calculate this
					deposit_complete: false,
					deposit_refunded: false,
					deposit_refund_amount: null,
					deposit_hold_until: null,
					deposit_calculation_start_date: null, // Auto-calculation from van start
					notes: data.notes ?? null,
				})
				if (newVan) {
					addVan(newVan)
					toast.success('Van hire added successfully', { duration: 3000 })
					onClose()
				} else {
					toast.error('Failed to add van hire', { duration: 3000 })
				}
			}
		} catch (error) {
			console.error('Error saving van hire:', error)
			toast.error('An error occurred', { duration: 3000 })
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!van) return

		setIsDeleting(true)
		try {
			const success = await deleteVanHire(van.id)
			if (success) {
				removeVan(van.id)
				toast.success('Van hire deleted', { duration: 3000 })
				setShowDeleteConfirm(false)
				onClose()
			} else {
				toast.error('Failed to delete van hire', { duration: 3000 })
			}
		} catch (error) {
			console.error('Error deleting van hire:', error)
			toast.error('An error occurred', { duration: 3000 })
		} finally {
			setIsDeleting(false)
		}
	}

	const handleOffHire = async () => {
		if (!van || !offHireDateInput) {
			toast.error('Please enter an off-hire date', { duration: 3000 })
			return
		}

		setSaving(true)
		try {
			const offHireDate = new Date(offHireDateInput)
			const updated = await offHireVan(van.id, offHireDate)
			if (updated) {
				updateVanStore(van.id, updated)
				toast.success('Van off-hired successfully', { duration: 3000 })
				setShowOffHire(false)
				onClose()
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

	const handleRefund = async () => {
		if (!van || !refundAmountInput) {
			toast.error('Please enter a refund amount', { duration: 3000 })
			return
		}

		const refundAmount = Math.round(parseFloat(refundAmountInput) * 100)
		if (refundAmount > van.deposit_paid) {
			toast.error('Refund amount cannot exceed deposit paid', {
				duration: 3000,
			})
			return
		}

		setSaving(true)
		try {
			const updated = await refundDeposit(van.id, refundAmount)
			if (updated) {
				updateVanStore(van.id, updated)
				toast.success('Deposit refunded successfully', { duration: 3000 })
				setShowRefund(false)
				onClose()
			} else {
				toast.error('Failed to refund deposit', { duration: 3000 })
			}
		} catch (error) {
			console.error('Error refunding deposit:', error)
			toast.error('An error occurred', { duration: 3000 })
		} finally {
			setSaving(false)
		}
	}

	// Note: Deposits are auto-calculated by the system, not user-editable

	return (
		<div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
			<Card className='bg-slate-900 border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
				<div className='p-6'>
					{/* Header */}
					<div className='flex items-center justify-between mb-6'>
						<h2 className='text-2xl font-bold text-white'>
							{isEditMode ? 'Edit Van Hire' : 'New Van Hire'}
						</h2>
						<Button
							variant='ghost'
							size='icon'
							onClick={onClose}
							className='text-slate-400 hover:text-white hover:bg-white/10'
						>
							<X className='w-5 h-5' />
						</Button>
					</div>

					{/* Form */}
					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-6'
					>
						{/* Registration */}
						<div>
							<Label
								htmlFor='registration'
								className='text-white'
							>
								Registration Number *
							</Label>
							<Controller
								name='registration'
								control={control}
								render={({ field }) => (
									<Input
										{...field}
										id='registration'
										placeholder='e.g., AB12 CDE'
										className='bg-white/5 border-white/20 text-white mt-2'
									/>
								)}
							/>
							{errors.registration && (
								<p className='text-red-400 text-sm mt-1'>
									{errors.registration.message}
								</p>
							)}
						</div>

						{/* Van Type & Weekly Rate */}
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='van_type'
									className='text-white'
								>
									Van Type
								</Label>
								<Controller
									name='van_type'
									control={control}
									render={({ field }) => (
										<Select
											value={field.value ?? ''}
											onValueChange={(value) =>
												field.onChange(value as VanType)
											}
										>
											<SelectTrigger className='bg-white/5 border-white/20 text-white mt-2'>
												<SelectValue placeholder='Select type' />
											</SelectTrigger>
											<SelectContent className='bg-slate-900 border-white/20'>
												<SelectItem
													value='Fleet'
													className='text-white hover:bg-white/10 focus:bg-white/10'
												>
													Fleet (£250/week)
												</SelectItem>
												<SelectItem
													value='Flexi'
													className='text-white hover:bg-white/10 focus:bg-white/10'
												>
													Flexi (£100-£250/week)
												</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
							</div>

							<div>
								<Label
									htmlFor='weekly_rate'
									className='text-white'
								>
									Weekly Rate (£) *
								</Label>
								<Controller
									name='weekly_rate'
									control={control}
									render={({ field }) => (
										<NumberInput
											id='weekly_rate'
											value={field.value / 100}
											onChange={(value) => field.onChange(value * 100)}
											min={0}
											max={1000}
											chevronSize='sm'
											className='bg-white/5 border-white/20 text-white mt-2'
										/>
									)}
								/>
								{errors.weekly_rate && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.weekly_rate.message}
									</p>
								)}
							</div>
						</div>

						{/* Dates */}
						<div className='grid grid-cols-2 gap-4'>
							<div>
								<Label
									htmlFor='on_hire_date'
									className='text-white'
								>
									On-Hire Date *
								</Label>
								<Controller
									name='on_hire_date'
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											id='on_hire_date'
											type='date'
											lang='en-GB'
											className='bg-white/5 border-white/20 text-white mt-2'
										/>
									)}
								/>
								{errors.on_hire_date && (
									<p className='text-red-400 text-sm mt-1'>
										{errors.on_hire_date.message}
									</p>
								)}
							</div>

							<div>
								<Label
									htmlFor='off_hire_date'
									className='text-white'
								>
									Off-Hire Date
								</Label>
								<Controller
									name='off_hire_date'
									control={control}
									render={({ field }) => (
										<Input
											{...field}
											value={field.value ?? ''}
											id='off_hire_date'
											type='date'
											lang='en-GB'
											className='bg-white/5 border-white/20 text-white mt-2'
											disabled={isEditMode && !van?.off_hire_date}
										/>
									)}
								/>
								{errors.off_hire_date ? (
									<p className='text-red-400 text-xs mt-1'>
										{errors.off_hire_date.message}
									</p>
								) : (
									<p className='text-slate-400 text-xs mt-1'>
										Leave empty if currently on-hire
									</p>
								)}
							</div>
						</div>

						{/* Deposit Status (Read-Only) */}
						{isEditMode && van && (
							<div className='bg-white/5 border border-white/20 rounded-lg p-4'>
								<p className='text-slate-400 text-sm mb-2'>Deposit Status</p>
								<div className='flex items-center justify-between'>
									<span className='text-white'>Current Deposit:</span>
									<span className='text-white font-mono font-semibold'>
										£{(van.deposit_paid / 100).toFixed(2)}
									</span>
								</div>
								<p className='text-slate-500 text-xs mt-2'>
									Deposits are automatically calculated by the system based on
									weeks with any van
								</p>
							</div>
						)}

						{/* Notes */}
						<div>
							<Label
								htmlFor='notes'
								className='text-white'
							>
								Notes
							</Label>
							<Controller
								name='notes'
								control={control}
								render={({ field }) => (
									<Textarea
										{...field}
										value={field.value ?? ''}
										id='notes'
										placeholder='Additional notes about this van hire...'
										className='bg-white/5 border-white/20 text-white mt-2 min-h-[100px]'
									/>
								)}
							/>
							{errors.notes && (
								<p className='text-red-400 text-sm mt-1'>
									{errors.notes.message}
								</p>
							)}
						</div>

						{/* Actions */}
						<div className='pt-4 border-t border-white/20 space-y-3'>
							{/* Off-Hire Button (Full Width) */}
							{isEditMode && van && !van.off_hire_date && (
								<Button
									type='button'
									variant='outline'
									onClick={() => setShowOffHire(true)}
									className='w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
								>
									Off-Hire Van
								</Button>
							)}

							{/* Bottom Action Buttons */}
							<div className='flex items-center justify-between'>
								<div className='flex gap-2'>
									{isEditMode && van && (
										<>
											<Button
												type='button'
												variant='outline'
												onClick={() => setShowDeleteConfirm(true)}
												disabled={isDeleting || isSubmitting}
												className='border-red-500/30 text-red-400 hover:bg-red-500/10'
											>
												<Trash2 className='w-4 h-4 mr-2' />
												Delete
											</Button>
											{van.off_hire_date &&
												!van.deposit_refunded &&
												van.deposit_paid > 0 && (
													<Button
														type='button'
														variant='outline'
														onClick={() => setShowRefund(true)}
														className='border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
													>
														Refund Deposit
													</Button>
												)}
										</>
									)}
								</div>

								<div className='flex gap-2'>
									<Button
										type='button'
										variant='outline'
										onClick={onClose}
										disabled={isSubmitting}
										className='border-white/20 text-white hover:bg-white/10'
									>
										Cancel
									</Button>
									<Button
										type='submit'
										disabled={isSubmitting}
										className='bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600'
									>
										{isSubmitting ? (
											<Loader2 className='w-4 h-4 mr-2 animate-spin' />
										) : (
											<Save className='w-4 h-4 mr-2' />
										)}
										{isEditMode ? 'Update' : 'Create'}
									</Button>
								</div>
							</div>
						</div>
					</form>
				</div>
			</Card>

			{/* Delete Confirmation Dialog */}
			<ConfirmationDialog
				open={showDeleteConfirm}
				onOpenChange={setShowDeleteConfirm}
				onConfirm={handleDelete}
				title="Delete Van Hire?"
				description={
					<>
						Are you sure you want to delete this van hire?
						{van && (
							<>
								<br />
								<br />
								<strong>{van.registration}</strong>
							</>
						)}
						<br />
						<br />
						This action cannot be undone.
					</>
				}
				confirmText="Delete"
				cancelText="Cancel"
				variant="destructive"
				icon={<AlertCircle className="w-6 h-6" />}
				isLoading={isDeleting}
			/>

			{/* Off-Hire Dialog */}
			{showOffHire && (
				<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4'>
					<Card className='bg-slate-900 border-white/20 max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-white mb-4'>Off-Hire Van</h3>
						<p className='text-slate-400 mb-4'>
							Enter the date when the van was returned. The deposit will be held
							for 6 weeks.
						</p>

						{/* Important Info Box */}
						<div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4'>
							<p className='text-blue-400 text-sm font-semibold mb-1'>
								Important: Same-Day Van Swaps
							</p>
							<p className='text-blue-300 text-xs'>
								The off-hire date is the <strong>last day</strong> you had the
								van. If you're picking up a new van the same morning you're
								returning this one, off-hire this van on the{' '}
								<strong>previous day</strong> to avoid counting the same day
								twice.
							</p>
						</div>

						<Label
							htmlFor='off_hire_input'
							className='text-white'
						>
							Off-Hire Date *
						</Label>
						<Input
							id='off_hire_input'
							type='date'
							value={offHireDateInput}
							onChange={(e) => setOffHireDateInput(e.target.value)}
							lang='en-GB'
							className='bg-white/5 border-white/20 text-white mt-2 mb-4'
						/>
						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => setShowOffHire(false)}
								className='border-white/20 text-white hover:bg-white/10'
							>
								Cancel
							</Button>
							<Button
								onClick={handleOffHire}
								className='bg-gradient-to-r from-blue-500 to-emerald-500'
							>
								Confirm Off-Hire
							</Button>
						</div>
					</Card>
				</div>
			)}

			{/* Refund Dialog */}
			{showRefund && (
				<div className='fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4'>
					<Card className='bg-slate-900 border-white/20 max-w-md w-full p-6'>
						<h3 className='text-xl font-bold text-white mb-4'>
							Refund Deposit
						</h3>
						<p className='text-slate-400 mb-4'>
							Enter the refund amount (after deducting any damage costs).
						</p>
						<Label
							htmlFor='refund_input'
							className='text-white'
						>
							Refund Amount (£) *
						</Label>
						<Input
							id='refund_input'
							type='number'
							step='0.01'
							value={refundAmountInput}
							onChange={(e) => setRefundAmountInput(e.target.value)}
							className='bg-white/5 border-white/20 text-white mt-2 mb-2'
						/>
						<p className='text-slate-400 text-xs mb-4'>
							Max: £{van ? (van.deposit_paid / 100).toFixed(2) : '0.00'}
						</p>
						<div className='flex gap-2 justify-end'>
							<Button
								variant='outline'
								onClick={() => setShowRefund(false)}
								className='border-white/20 text-white hover:bg-white/10'
							>
								Cancel
							</Button>
							<Button
								onClick={handleRefund}
								className='bg-gradient-to-r from-emerald-500 to-blue-500'
							>
								Confirm Refund
							</Button>
						</div>
					</Card>
				</div>
			)}
		</div>
	)
}
