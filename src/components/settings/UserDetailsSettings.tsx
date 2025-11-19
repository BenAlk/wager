import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'

/**
 * User details form validation schema
 */
const userDetailsSchema = z.object({
	displayName: z
		.string()
		.min(1, 'Display name is required')
		.max(50, 'Display name must be 50 characters or less'),
	firstName: z
		.string()
		.max(50, 'First name must be 50 characters or less')
		.optional()
		.or(z.literal('')),
	lastName: z
		.string()
		.max(50, 'Last name must be 50 characters or less')
		.optional()
		.or(z.literal('')),
})

type UserDetailsFormData = z.infer<typeof userDetailsSchema>

export function UserDetailsSettings() {
	const { user, refreshUser } = useAuth()
	const [isSaving, setIsSaving] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors, isDirty },
	} = useForm<UserDetailsFormData>({
		resolver: zodResolver(userDetailsSchema),
		defaultValues: {
			displayName: '',
			firstName: '',
			lastName: '',
		},
	})

	/**
	 * Load user details on mount
	 */
	useEffect(() => {
		const loadUserDetails = async () => {
			if (!user?.id) return

			try {
				const { data, error } = await supabase
					.from('users')
					.select('display_name, first_name, last_name')
					.eq('id', user.id)
					.single()

				if (error) {
					console.error('Error loading user details:', error)
					toast.error('Failed to load user details')
					return
				}

				reset({
					displayName: data.display_name || '',
					firstName: data.first_name || '',
					lastName: data.last_name || '',
				})
			} catch (err) {
				console.error('Error in loadUserDetails:', err)
				toast.error('Failed to load user details')
			} finally {
				setIsLoading(false)
			}
		}

		loadUserDetails()
	}, [user?.id, reset])

	/**
	 * Save user details to Supabase
	 */
	const onSubmit = async (data: UserDetailsFormData) => {
		if (!user?.id) return

		setIsSaving(true)

		try {
			const { error } = await supabase
				.from('users')
				.update({
					display_name: data.displayName || null,
					first_name: data.firstName || null,
					last_name: data.lastName || null,
				})
				.eq('id', user.id)

			if (error) {
				console.error('Error saving user details:', error)
				toast.error('Failed to save user details')
				return
			}

			// Refresh user data in auth context
			await refreshUser()

			// Reset form to mark as clean
			reset(data)

			toast.success('User details saved successfully!')
		} catch (err) {
			console.error('Error in onSubmit:', err)
			toast.error('Failed to save user details')
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='flex items-center gap-2' style={{ color: 'var(--text-primary)' }}>
					<Loader2 className='w-6 h-6 animate-spin' />
					<p className='text-lg'>Loading user details...</p>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* User Details Form */}
			<form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
				{/* Profile Information Card */}
				<Card
					className='backdrop-blur-xl p-6'
					style={{
						backgroundColor: 'var(--bg-surface-primary)',
						borderColor: 'var(--border-primary)',
					}}
				>
					<h2 className='text-xl font-semibold mb-4' style={{ color: 'var(--text-primary)' }}>
						Profile Information
					</h2>
					<p className='text-sm mb-6' style={{ color: 'var(--text-secondary)' }}>
						Update your personal information. Display name is required, while first and
						last names are optional.
					</p>

					<div className='space-y-4'>
						{/* Display Name (Username) */}
						<div>
							<Label htmlFor='displayName' style={{ color: 'var(--input-label)' }}>
								Display Name <span className='text-red-400'>*</span>
							</Label>
							<Controller
								name='displayName'
								control={control}
								render={({ field }) => (
									<Input
										id='displayName'
										{...field}
										placeholder='Enter your display name'
										className='mt-2 h-12 focus:ring-2 focus:ring-blue-500'
										style={{
											backgroundColor: 'var(--input-bg)',
											borderColor: 'var(--input-border)',
											color: 'var(--input-text)',
										}}
									/>
								)}
							/>
							{errors.displayName && (
								<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
									{errors.displayName.message}
								</p>
							)}
							<p className='text-xs mt-1' style={{ color: 'var(--text-tertiary)' }}>
								This is how you'll be identified in the app
							</p>
						</div>

						{/* First Name */}
						<div>
							<Label htmlFor='firstName' style={{ color: 'var(--input-label)' }}>
								First Name
							</Label>
							<Controller
								name='firstName'
								control={control}
								render={({ field }) => (
									<Input
										id='firstName'
										{...field}
										placeholder='Enter your first name (optional)'
										className='mt-2 h-12 focus:ring-2 focus:ring-blue-500'
										style={{
											backgroundColor: 'var(--input-bg)',
											borderColor: 'var(--input-border)',
											color: 'var(--input-text)',
										}}
									/>
								)}
							/>
							{errors.firstName && (
								<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
									{errors.firstName.message}
								</p>
							)}
						</div>

						{/* Last Name */}
						<div>
							<Label htmlFor='lastName' style={{ color: 'var(--input-label)' }}>
								Last Name
							</Label>
							<Controller
								name='lastName'
								control={control}
								render={({ field }) => (
									<Input
										id='lastName'
										{...field}
										placeholder='Enter your last name (optional)'
										className='mt-2 h-12 focus:ring-2 focus:ring-blue-500'
										style={{
											backgroundColor: 'var(--input-bg)',
											borderColor: 'var(--input-border)',
											color: 'var(--input-text)',
										}}
									/>
								)}
							/>
							{errors.lastName && (
								<p className='text-sm mt-1' style={{ color: 'var(--input-error-text)' }}>
									{errors.lastName.message}
								</p>
							)}
						</div>
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
								Saving...
							</>
						) : (
							<>
								<Save className='w-4 h-4 mr-2' />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</form>

			{/* Danger Zone - Delete Account */}
			<Card className='bg-red-500/5 backdrop-blur-xl border-red-500/30 p-6'>
				<h2 className='text-xl font-semibold text-red-400 mb-4'>Danger Zone</h2>
				<div className='space-y-4'>
					<div>
						<h3 className='text-lg font-medium text-red-300 mb-2'>Delete Account</h3>
						<p className='text-sm mb-4' style={{ color: 'var(--text-secondary)' }}>
							Permanently delete your account and all associated data. This action cannot
							be undone.
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
		</div>
	)
}
