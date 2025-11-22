import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'
import * as React from 'react'

export interface NumberInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		'type' | 'onChange' | 'value' | 'size'
	> {
	value?: number | null
	onChange?: (value: number) => void
	min?: number
	max?: number
	step?: number | 'any'
	/** Size variant for the chevron buttons. 'default' matches Settings page, 'sm' is smaller for compact layouts */
	chevronSize?: 'default' | 'sm'
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
	(
		{
			className,
			value,
			onChange,
			min,
			max,
			step = 1,
			chevronSize = 'default',
			...props
		},
		ref
	) => {
		const [localValue, setLocalValue] = React.useState<number>(value ?? 0)

		React.useEffect(() => {
			setLocalValue(value ?? 0)
		}, [value])

		// Use step for increment/decrement, default to 1 if "any"
		const numericStep = typeof step === 'number' ? step : 1

		const handleIncrement = () => {
			const newValue = localValue + numericStep
			if (max !== undefined && newValue > max) return
			setLocalValue(newValue)
			onChange?.(newValue)
		}

		const handleDecrement = () => {
			const newValue = localValue - numericStep
			if (min !== undefined && newValue < min) return
			setLocalValue(newValue)
			onChange?.(newValue)
		}

		// For HTML input, use "any" if step is very small to avoid browser validation issues
		const htmlStep = typeof step === 'number' && step < 0.01 ? 'any' : step

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value === '' ? 0 : parseFloat(e.target.value)
			if (isNaN(newValue)) return

			// Apply min/max constraints
			let constrainedValue = newValue
			if (min !== undefined && constrainedValue < min) constrainedValue = min
			if (max !== undefined && constrainedValue > max) constrainedValue = max

			setLocalValue(constrainedValue)
			onChange?.(constrainedValue)
		}

		// Size-specific styles
		const paddingRight = chevronSize === 'sm' ? 'pr-9' : 'pr-12'
		const buttonSize = chevronSize === 'sm' ? 'p-0.5' : 'p-1'
		const iconSize = chevronSize === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'

		return (
			<div className='relative'>
				<input
					type='number'
					className={cn(
						'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
						paddingRight,
						className
					)}
					value={localValue}
					onChange={handleInputChange}
					onFocus={(e) => {
						e.target.select()
						props.onFocus?.(e)
					}}
					min={min}
					step={htmlStep}
					max={max}
					ref={ref}
					{...props}
				/>
				<div className='absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5'>
					<button
						type='button'
						onClick={handleIncrement}
						className={cn(
							'bg-white/5 hover:bg-blue-500/20 rounded transition-colors group cursor-pointer',
							buttonSize
						)}
						aria-label='Increase value'
						tabIndex={-1}
					>
						<ChevronUp
							className={cn(
								'text-slate-400 group-hover:text-blue-400',
								iconSize
							)}
						/>
					</button>
					<button
						type='button'
						onClick={handleDecrement}
						className={cn(
							'bg-white/5 hover:bg-blue-500/20 rounded transition-colors group cursor-pointer',
							buttonSize
						)}
						aria-label='Decrease value'
						tabIndex={-1}
					>
						<ChevronDown
							className={cn(
								'text-slate-400 group-hover:text-blue-400',
								iconSize
							)}
						/>
					</button>
				</div>
			</div>
		)
	}
)
NumberInput.displayName = 'NumberInput'

export { NumberInput }
