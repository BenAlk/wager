import { StrictMode, Suspense } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Import i18n configuration
import App from './App.tsx'

// Axe accessibility audit in development
if (import.meta.env.DEV) {
	import('@axe-core/react').then((axe) => {
		axe.default(React, createRoot, 1000)
	})
}

// Loading fallback while translations load
const LoadingFallback = () => (
	<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
		<div className="text-white text-lg">Loading...</div>
	</div>
)

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Suspense fallback={<LoadingFallback />}>
			<App />
		</Suspense>
	</StrictMode>
)
