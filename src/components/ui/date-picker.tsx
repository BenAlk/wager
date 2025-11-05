import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
	date?: Date
	onDateChange: (date: Date | undefined) => void
	placeholder?: string
	disabled?: boolean
	className?: string
}

export function DatePicker({
	date,
	onDateChange,
	placeholder = 'Pick a date',
	disabled = false,
	className,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					disabled={disabled}
					className={cn(
						'w-full justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white',
						!date && 'text-slate-400',
						className
					)}
				>
					<CalendarIcon className='mr-2 h-4 w-4' />
					{date ? format(date, 'dd/MM/yyyy', { locale: enGB }) : <span>{placeholder}</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0 bg-slate-900 border-white/20' align='start'>
				<DayPicker
					mode='single'
					selected={date}
					onSelect={(selectedDate) => {
						onDateChange(selectedDate)
						setOpen(false)
					}}
					locale={enGB}
					className='rdp-custom'
					classNames={{
						months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
						month: 'space-y-4',
						caption: 'flex justify-center pt-1 relative items-center text-white',
						caption_label: 'text-sm font-medium',
						nav: 'space-x-1 flex items-center',
						nav_button: cn(
							'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 rounded-md transition-colors'
						),
						nav_button_previous: 'absolute left-1',
						nav_button_next: 'absolute right-1',
						table: 'w-full border-collapse space-y-1',
						head_row: 'flex',
						head_cell: 'text-slate-400 rounded-md w-9 font-normal text-[0.8rem]',
						row: 'flex w-full mt-2',
						cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-white/5 [&:has([aria-selected])]:bg-white/5 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
						day: cn(
							'h-9 w-9 p-0 font-normal text-white aria-selected:opacity-100 hover:bg-white/10 rounded-md transition-colors'
						),
						day_range_end: 'day-range-end',
						day_selected:
							'bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-emerald-600 focus:bg-gradient-to-r focus:from-blue-500 focus:to-emerald-500',
						day_today: 'bg-white/20 text-white',
						day_outside:
							'day-outside text-slate-500 opacity-50 aria-selected:bg-white/5 aria-selected:text-slate-500 aria-selected:opacity-30',
						day_disabled: 'text-slate-600 opacity-50',
						day_hidden: 'invisible',
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}
