import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { Toaster } from '@/components/ui/sonner'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import Calendar from '@/pages/Calendar'
import Settings from '@/pages/Settings'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth()

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
				<p className='text-white text-lg'>Loading...</p>
			</div>
		)
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
		return (
			<div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center'>
				<p className='text-white text-lg'>Loading...</p>
			</div>
		)
	}

	if (user) {
		return <Navigate to='/dashboard' replace />
	}

	return <>{children}</>
}

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route
						path='/auth'
						element={
							<PublicRoute>
								<Auth />
							</PublicRoute>
						}
					/>
					<Route
						path='/dashboard'
						element={
							<ProtectedRoute>
								<Dashboard />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/calendar'
						element={
							<ProtectedRoute>
								<Calendar />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/settings'
						element={
							<ProtectedRoute>
								<Settings />
							</ProtectedRoute>
						}
					/>
					<Route path='/' element={<Navigate to='/dashboard' replace />} />
				</Routes>
				<Toaster />
			</AuthProvider>
		</BrowserRouter>
	)
}

export default App
