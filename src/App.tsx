import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Toaster } from '@/components/ui/sonner'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/PageTransition'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
import { MainLayout } from '@/components/layout/MainLayout'
import { useThemeStore } from '@/store/themeStore'
import { useOnboardingStore, useAuthStore } from '@/store'
import { OnboardingModal, TourGuide } from '@/components/onboarding'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Calendar from '@/pages/Calendar'
import Settings from '@/pages/Settings'
import VanManagement from '@/pages/VanManagement'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth()

	if (loading) {
		return <LoadingScreen />
	}

	if (!user) {
		return <Navigate to='/auth' replace />
	}

	return <>{children}</>
}

// Public route component (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth()

	if (loading) {
		return <LoadingScreen />
	}

	if (user) {
		return <Navigate to='/dashboard' replace />
	}

	return <>{children}</>
}

function AnimatedRoutes() {
	const location = useLocation()

	return (
		<AnimatePresence mode='wait'>
			<Routes location={location} key={location.pathname}>
				<Route
					path='/auth'
					element={
						<PublicRoute>
							<PageTransition>
								<Auth />
							</PageTransition>
						</PublicRoute>
					}
				/>
				<Route
					element={
						<ProtectedRoute>
							<MainLayout />
						</ProtectedRoute>
					}
				>
					<Route
						path='/dashboard'
						element={
							<PageTransition>
								<Dashboard />
							</PageTransition>
						}
					/>
					<Route
						path='/calendar'
						element={
							<PageTransition>
								<Calendar />
							</PageTransition>
						}
					/>
					<Route
						path='/settings'
						element={
							<PageTransition>
								<Settings />
							</PageTransition>
						}
					/>
					<Route
						path='/vans'
						element={
							<PageTransition>
								<VanManagement />
							</PageTransition>
						}
					/>
				</Route>
				<Route path='/' element={<Navigate to='/dashboard' replace />} />
			</Routes>
		</AnimatePresence>
	)
}

function App() {
	const { theme, setTheme } = useThemeStore()
	const { userProfile } = useAuthStore()
	const { startOnboarding, hasSkippedOnboarding } = useOnboardingStore()

	// Initialize theme on mount
	useEffect(() => {
		setTheme(theme) // Ensures class is applied
	}, [])

	// Check if user needs onboarding
	useEffect(() => {
		// Use database as source of truth for onboarding status
		// This ensures each user gets onboarding regardless of browser/localStorage state
		if (userProfile) {
			const dbCompleted = userProfile.onboarding_completed ?? false

			// If database shows not completed AND user hasn't skipped, trigger onboarding
			if (!dbCompleted && !hasSkippedOnboarding) {
				// Small delay to let the dashboard load first
				setTimeout(() => {
					startOnboarding()
				}, 500)
			}
		}
	}, [userProfile, startOnboarding, hasSkippedOnboarding])

	return (
		<BrowserRouter>
			<AuthProvider>
				<AnimatedRoutes />
				<Toaster />
				<OnboardingModal />
				<TourGuide />
			</AuthProvider>
		</BrowserRouter>
	)
}

export default App
