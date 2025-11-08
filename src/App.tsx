import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Toaster } from '@/components/ui/sonner'
import { AnimatePresence } from 'framer-motion'
import { PageTransition } from '@/components/shared/PageTransition'
import { LoadingScreen } from '@/components/shared/LoadingScreen'
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
					path='/dashboard'
					element={
						<ProtectedRoute>
							<PageTransition>
								<Dashboard />
							</PageTransition>
						</ProtectedRoute>
					}
				/>
				<Route
					path='/calendar'
					element={
						<ProtectedRoute>
							<PageTransition>
								<Calendar />
							</PageTransition>
						</ProtectedRoute>
					}
				/>
				<Route
					path='/settings'
					element={
						<ProtectedRoute>
							<PageTransition>
								<Settings />
							</PageTransition>
						</ProtectedRoute>
					}
				/>
				<Route
					path='/vans'
					element={
						<ProtectedRoute>
							<PageTransition>
								<VanManagement />
							</PageTransition>
						</ProtectedRoute>
					}
				/>
				<Route path='/' element={<Navigate to='/dashboard' replace />} />
			</Routes>
		</AnimatePresence>
	)
}

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AnimatedRoutes />
				<Toaster />
			</AuthProvider>
		</BrowserRouter>
	)
}

export default App
