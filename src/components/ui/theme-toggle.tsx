import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
	const { theme, toggleTheme } = useThemeStore()

	return (
		<Button
			onClick={toggleTheme}
			variant='outline'
			size='icon'
			className='bg-[var(--nav-button-inactive-bg)] border-[var(--nav-button-inactive-border)] text-[var(--nav-button-inactive-text)] hover:bg-[var(--nav-button-hover)] transition-colors'
			aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
		>
			{theme === 'dark' ? (
				<Sun className='w-5 h-5' aria-hidden='true' />
			) : (
				<Moon className='w-5 h-5' aria-hidden='true' />
			)}
		</Button>
	)
}
