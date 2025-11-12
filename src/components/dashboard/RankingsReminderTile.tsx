import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Award, Loader2, X } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { fetchWeekWithWorkDays, updateWeekRankings } from '@/lib/api/weeks'
import { getPreviousWeek, dateToWeekNumber } from '@/lib/dates'
import { getDailyBonusRate } from '@/lib/calculations'

import { DashboardTile } from './DashboardTile'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

const rankingsSchema = z.object({
	individual_level: z.enum(['Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+']),
	company_level: z.enum(['Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+']),
})

type RankingsFormData = z.infer<typeof rankingsSchema>

export function RankingsReminderTile() {
	const { user } = useAuth()
	const [showModal, setShowModal] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [weekNMinus2Data, setWeekNMinus2Data] = useState<any>(null)
	const [missingRankings, setMissingRankings] = useState(false)

	const today = new Date()
	const { week: currentWeek, year: currentYear } = dateToWeekNumber(today)
	const weekNMinus2Info = getPreviousWeek(currentWeek, currentYear, 2)

	const {
		control,
		handleSubmit,
		watch,
		reset,
	} = useForm<RankingsFormData>({
		resolver: zodResolver(rankingsSchema),
		defaultValues: {
			individual_level: 'Fantastic',
			company_level: 'Fantastic',
		},
	})

	// Reset form to defaults when modal opens
	useEffect(() => {
		if (showModal) {
			reset({
				individual_level: 'Fantastic',
				company_level: 'Fantastic',
			})
		}
	}, [showModal, reset])

	const individualLevel = watch('individual_level')
	const companyLevel = watch('company_level')

	// Calculate projected bonus
	const dailyBonusRate = getDailyBonusRate(individualLevel, companyLevel)
	const daysWorked = weekNMinus2Data?.workDays?.length || 0
	const projectedBonus = dailyBonusRate * daysWorked

	useEffect(() => {
		const fetchRankingsStatus = async () => {
			if (!user?.id) return

			const result = await fetchWeekWithWorkDays(
				user.id,
				weekNMinus2Info.week,
				weekNMinus2Info.year
			)

			// Set a marker object if result is null (no week data at all)
			setWeekNMinus2Data(result || { week: {}, workDays: [] })

			const hasWorkDays = result && result.workDays && result.workDays.length > 0
			const hasRankings = result?.week.individual_level && result?.week.company_level

			setMissingRankings(Boolean(hasWorkDays && !hasRankings))
		}

		fetchRankingsStatus()
	}, [user?.id, weekNMinus2Info.week, weekNMinus2Info.year])

	const onSubmit = async (data: RankingsFormData) => {
		if (!user?.id || !weekNMinus2Data) return

		setIsSubmitting(true)
		try {
			const updated = await updateWeekRankings(
				weekNMinus2Data.week.id,
				data.individual_level,
				data.company_level,
				projectedBonus
			)

			if (updated) {
				toast.success('Rankings saved!', { duration: 3000 })
				setShowModal(false)
				setMissingRankings(false)
			// Update the weekNMinus2Data with the new rankings
			setWeekNMinus2Data({
				...weekNMinus2Data,
				week: updated,
			})
			} else {
				toast.error('Failed to save rankings')
			}
		} catch (error) {
			console.error('Error saving rankings:', error)
			toast.error('An error occurred')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Show placeholder if rankings exist
	if (!missingRankings && weekNMinus2Data && weekNMinus2Data.week.individual_level) {
		return (
			<DashboardTile title='Performance Rankings' icon={Award}>
				<div className='text-center py-4'>
					<p className='text-[var(--text-primary)] text-sm mb-2'>
						Week {weekNMinus2Info.week} rankings entered
					</p>
					<div className='flex justify-center gap-4 text-xs'>
						<div>
							<span className='text-[var(--text-secondary)]'>Individual: </span>
							<span className='text-[var(--text-success)]'>
								{weekNMinus2Data.week.individual_level}
							</span>
						</div>
						<div>
							<span className='text-[var(--text-secondary)]'>Company: </span>
							<span className='text-[var(--text-success)]'>
								{weekNMinus2Data.week.company_level}
							</span>
						</div>
					</div>
				</div>
			</DashboardTile>
		)
	}

	// Show placeholder if no work days exist for week N-2
	if (!missingRankings && weekNMinus2Data) {
		return (
			<DashboardTile title='Performance Rankings' icon={Award}>
				<div className='text-center py-4'>
					<p className='text-[var(--text-secondary)] text-sm mb-2'>
						Week {weekNMinus2Info.week}
					</p>
					<p className='text-[var(--text-tertiary)] text-xs'>
						No bonus eligible - no days worked
					</p>
				</div>
			</DashboardTile>
		)
	}

	// Don't show anything if data hasn't loaded yet
	if (!weekNMinus2Data) {
		return null
	}

	return (
		<>
			<DashboardTile title='Rankings Reminder' icon={Award}>
				<div className='flex flex-col min-h-full justify-evenly items-center py-4'>
					<p className='text-[var(--text-warning)] text-sm'>
						Week {weekNMinus2Info.week} rankings are missing!
					</p>
					<Button
						onClick={() => setShowModal(true)}
						className='w-1/2 h-10 bg-gradient-to-r from-[var(--button-warning-from)] to-[var(--button-warning-to)] hover:from-[var(--button-warning-hover-from)] hover:to-[var(--button-warning-hover-to)] text-[var(--text-primary)]'
					>
						Enter Rankings Now
					</Button>
				</div>
			</DashboardTile>

			{/* Rankings Modal */}
			{showModal && (
				<div className='fixed inset-0 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4'>
					<Card className='bg-[var(--modal-bg)] border-[var(--modal-border)] max-w-md w-full p-6'>
						<div className='flex items-center justify-between mb-4'>
							<h3 className='text-xl font-bold text-[var(--text-primary)]'>
								Enter Rankings - Week {weekNMinus2Info.week}
							</h3>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => setShowModal(false)}
								className='text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
							>
								<X className='w-5 h-5' />
							</Button>
						</div>

						<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
							<div>
								<Label htmlFor='individual_level' className='text-[var(--input-label)]'>
									Individual Level
								</Label>
								<Controller
									name='individual_level'
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-2'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent className='bg-[var(--modal-bg)] border-[var(--modal-border)]'>
												{['Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+'].map(
													(level) => (
														<SelectItem
															key={level}
															value={level}
															className='text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]'
														>
															{level}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>
									)}
								/>
							</div>

							<div>
								<Label htmlFor='company_level' className='text-[var(--input-label)]'>
									Company Level
								</Label>
								<Controller
									name='company_level'
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className='bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--input-text)] mt-2'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent className='bg-[var(--modal-bg)] border-[var(--modal-border)]'>
												{['Poor', 'Fair', 'Great', 'Fantastic', 'Fantastic+'].map(
													(level) => (
														<SelectItem
															key={level}
															value={level}
															className='text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)]'
														>
															{level}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>
									)}
								/>
							</div>

							{projectedBonus > 0 && (
								<div className='bg-[var(--bg-success)] border border-[var(--border-success)] rounded-lg p-3'>
									<p className='text-[var(--text-success)] text-sm'>
										Projected Bonus: £{(projectedBonus / 100).toFixed(2)}
									</p>
									<p className='text-[var(--text-success)]/70 text-xs mt-1'>
										{daysWorked} days × £{(dailyBonusRate / 100).toFixed(2)}/day
									</p>
								</div>
							)}

							<div className='flex gap-2 justify-end pt-4'>
								<Button
									type='button'
									variant='outline'
									onClick={() => setShowModal(false)}
									disabled={isSubmitting}
									className='border-[var(--input-border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
								>
									Cancel
								</Button>
								<Button
									type='submit'
									disabled={isSubmitting}
									className='w-full h-10 bg-gradient-to-r from-[var(--button-primary-from)] to-[var(--button-primary-to)] hover:from-[var(--button-primary-hover-from)] hover:to-[var(--button-primary-hover-to)] text-[var(--text-primary)]'
								>
									{isSubmitting ? (
										<>
											<Loader2 className='w-4 h-4 mr-2 animate-spin' />
											Saving...
										</>
									) : (
										'Save Rankings'
									)}
								</Button>
							</div>
						</form>
					</Card>
				</div>
			)}
		</>
	)
}
