import * as React from 'react'

import { Input } from '@/components/ui/input'

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
	placeholder = 'dd/mm/yyyy',
	disabled = false,
	className,
}: DatePickerProps) {
	// Format date as DD/MM/YYYY for display
	const formatDateGB = (date: Date): string => {
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = date.getFullYear()
		return `${day}/${month}/${year}`
	}

	// Parse DD/MM/YYYY to Date
	const parseDateGB = (dateString: string): Date | undefined => {
		const parts = dateString.split('/')
		if (parts.length !== 3) return undefined

		const day = parseInt(parts[0], 10)
		const month = parseInt(parts[1], 10) - 1 // Months are 0-indexed
		const year = parseInt(parts[2], 10)

		if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined

		const date = new Date(year, month, day)
		// Validate the date is valid
		if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
			return undefined
		}

		return date
	}

	const [inputValue, setInputValue] = React.useState(date ? formatDateGB(date) : '')

	// Sync input value when date prop changes
	React.useEffect(() => {
		setInputValue(date ? formatDateGB(date) : '')
	}, [date])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		setInputValue(value)

		if (!value) {
			onDateChange(undefined)
			return
		}

		const parsedDate = parseDateGB(value)
		if (parsedDate) {
			onDateChange(parsedDate)
		}
	}

	const handleBlur = () => {
		// On blur, reformat to ensure valid format or clear
		if (inputValue) {
			const parsedDate = parseDateGB(inputValue)
			if (parsedDate) {
				setInputValue(formatDateGB(parsedDate))
			} else {
				// Invalid format, revert to last valid date or clear
				setInputValue(date ? formatDateGB(date) : '')
			}
		}
	}

	return (
		<Input
			type='text'
			value={inputValue}
			onChange={handleChange}
			onBlur={handleBlur}
			disabled={disabled}
			placeholder={placeholder}
			className={`bg-white/5 border-white/20 text-white ${className || ''}`}
		/>
	)
}
