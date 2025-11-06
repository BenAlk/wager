import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Briefcase, Loader2, Pencil } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { createWorkDay, getOrCreateWeek, fetchWeekWithWorkDays } from '@/lib/api/weeks'
import { dateToWeekNumber } from '@/lib/dates'
import { useSettingsStore } from '@/store/settingsStore'
import type { WorkDay } from '@/types/database'

import { DashboardTile } from './DashboardTile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

const workSchema = z.object({
	route_type: z.enum(['Normal', 'DRS']),
	route_number: z.string().min(1, 'Route number required'),
})

type WorkFormData = z.infer<typeof workSchema>

interface QuickAddWorkTileProps {
	onWorkAdded?: () => void
}

export function QuickAddWorkTile({ onWorkAdded }: QuickAddWorkTileProps) {
	const { user } = useAuth()
	const { settings } = useSettingsStore()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [todayWork, setTodayWork] = useState<WorkDay | null>(null)
	const [isEditing, setIsEditing] = useState(false)

	const today = new Date()
	const todayString = today.toISOString().split('T')[0]

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<WorkFormData>({
		resolver: zodResolver(workSchema),
		defaultValues: {
			route_type: 'Normal',
			route_number: '',
		},
	})

	// Fetch today's work on mount
	useEffect(() => {
		const fetchTodayWork = async () => {
			if (!user?.id) return

			const { week, year } = dateToWeekNumber(today)
			const weekData = await fetchWeekWithWorkDays(user.id, week, year)
			const work = weekData?.workDays?.find((wd) => wd.date === todayString)
			setTodayWork(work || null)
		}

		fetchTodayWork()
	}, [user?.id, todayString])

	const onSubmit = async (data: WorkFormData) => {
		if (!user?.id) return

		setIsSubmitting(true)
		try {
			const { week: weekNum, year } = dateToWeekNumber(today)

			// Get or create week
			const week = await getOrCreateWeek(user.id, weekNum, year)
			if (!week) {
				toast.error('Failed to create week')
				return
			}

			// Determine daily rate from route type
			const dailyRate =
				data.route_type === 'Normal'
					? settings?.normal_rate || 16000
					: settings?.drs_rate || 10000

			// Create work day
			const workDay = await createWorkDay({
				week_id: week.id,
				date: todayString,
				route_type: data.route_type,
				route_number: data.route_number,
				daily_rate: dailyRate,
				stops_given: 0,
				stops_taken: 0,
				amazon_paid_miles: 0,
				van_logged_miles: 0,
				notes: null,
			})

			if (workDay) {
				toast.success('Work added for today!', { duration: 3000 })
				setTodayWork(workDay)
				reset()
				onWorkAdded?.()
			} else {
				toast.error('Failed to add work')
			}
		} catch (error: any) {
			console.error('Error adding work:', error)
			if (error.message?.includes('duplicate')) {
				toast.error('Work already exists for today')
			} else {
				toast.error('An error occurred')
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	// Show work details if already added and not editing
	if (todayWork && !isEditing) {
		return (
			<DashboardTile title='Quick Add Work' icon={Briefcase}>
				<div className='space-y-4'>
					<div className='bg-white/5 rounded-lg p-4'>
						<div className='flex justify-between items-start mb-2'>
							<div>
								<p className='text-slate-400 text-xs'>Route Type</p>
								<p className='text-white font-semibold'>{todayWork.route_type}</p>
							</div>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setIsEditing(true)}
								className='text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8'
							>
								<Pencil className='w-4 h-4' />
							</Button>
						</div>
						<div>
							<p className='text-slate-400 text-xs'>Route Number</p>
							<p className='text-white font-semibold'>{todayWork.route_number}</p>
						</div>
					</div>
					<p className='text-slate-400 text-xs text-center'>
						Work logged for today
					</p>
				</div>
			</DashboardTile>
		)
	}

	return (
		<DashboardTile title='Quick Add Work' icon={Briefcase}>
			<form onSubmit={handleSubmit(onSubmit)} className='flex flex-col h-full'>
				<div className='space-y-1'>
					<div>
						<Label htmlFor='route_type' className='text-slate-300 text-sm'>
							Route Type
						</Label>
						<Controller
							name='route_type'
							control={control}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className='bg-white/5 border-white/20 text-white mt-1'>
										<SelectValue />
									</SelectTrigger>
									<SelectContent className='bg-slate-900 border-white/20'>
										<SelectItem
											value='Normal'
											className='text-white hover:bg-white/10 focus:bg-white/10'
										>
											Normal (£{((settings?.normal_rate || 16000) / 100).toFixed(0)})
										</SelectItem>
										<SelectItem
											value='DRS'
											className='text-white hover:bg-white/10 focus:bg-white/10'
										>
											DRS (£{((settings?.drs_rate || 10000) / 100).toFixed(0)})
										</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>

					<div>
						<Label htmlFor='route_number' className='text-slate-300 text-sm'>
							Route Number
						</Label>
						<Controller
							name='route_number'
							control={control}
							render={({ field }) => (
								<Input
									{...field}
									id='route_number'
									placeholder='e.g., DA01'
									className='bg-white/5 border-white/20 text-white mt-1'
								/>
							)}
						/>
						{errors.route_number && (
							<p className='text-red-400 text-xs mt-1'>
								{errors.route_number.message}
							</p>
						)}
					</div>
				</div>

				<Button
					type='submit'
					disabled={isSubmitting}
					className='w-full h-10 mt-auto bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600'
				>
					{isSubmitting ? (
						<>
							<Loader2 className='w-4 h-4 mr-2 animate-spin' />
							Adding...
						</>
					) : (
						'Add Work for Today'
					)}
				</Button>
			</form>
		</DashboardTile>
	)
}
