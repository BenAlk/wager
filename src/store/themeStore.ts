import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface ThemeState {
	theme: Theme
	setTheme: (theme: Theme) => void
	toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
	persist(
		(set, get) => ({
			theme: 'dark', // Default theme

			setTheme: (theme) => {
				set({ theme })
				// Update HTML class
				document.documentElement.classList.remove('dark', 'light')
				document.documentElement.classList.add(theme)
			},

			toggleTheme: () => {
				const newTheme = get().theme === 'dark' ? 'light' : 'dark'
				get().setTheme(newTheme)
			},
		}),
		{
			name: 'wager-theme', // localStorage key
			onRehydrateStorage: () => (state) => {
				// Apply theme on page load
				if (state?.theme) {
					document.documentElement.classList.add(state.theme)
				}
			},
		}
	)
)
