import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import * as React from 'react'

export interface NumberInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		'type' | 'onChange'
	> {
	value?: number
	onChange?: (value: number) => void
	min?: number
	max?: number
	step?: number
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	({ className, value = 0, onChange, min, max, step = 1, ...props }, ref) => {
		const [localValue, setLocalValue] = React.useState<number>(value)

		React.useEffect(() => {
			setLocalValue(value)
		}, [value])

		const handleIncrement = () => {
			const newValue = localValue + step
			if (max !== undefined && newValue > max) return
			setLocalValue(newValue)
			onChange?.(newValue)
		}

		const handleDecrement = () => {
			const newValue = localValue - step
			if (min !== undefined && newValue < min) return
			setLocalValue(newValue)
			onChange?.(newValue)
		}

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
			if (isNaN(newValue)) return

			// Apply min/max constraints
			let constrainedValue = newValue
			if (min !== undefined && constrainedValue < min) constrainedValue = min
			if (max !== undefined && constrainedValue > max) constrainedValue = max

			setLocalValue(constrainedValue)
			onChange?.(constrainedValue)
		}

		return (
			<div className='relative flex items-center'>
				<input
					type='number'
					className={cn(
						'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-8',
						className
					)}
					value={localValue}
					onChange={handleInputChange}
					min={min}
					max={max}
					ref={ref}
					{...props}
				/>
				<div className='absolute right-1 flex flex-col gap-0.5'>
					<button
						type='button'
						onClick={handleIncrement}
						className='p-0.5 mt-2 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer'
						tabIndex={-1}
					>
						<ChevronUp className='w-3 h-3' />
					</button>
					<button
						type='button'
						onClick={handleDecrement}
						className='p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer'
						tabIndex={-1}
					>
						<ChevronDown className='w-3 h-3' />
					</button>
				</div>
			</div>
		)
	}
)
NumberInput.displayName = 'NumberInput'

export { NumberInput }
