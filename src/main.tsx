import { StrictMode } from 'react'
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.then((registration) => {
				console.log('SW registered: ', registration)
			})
			.catch((registrationError) => {
				console.log('SW registration failed: ', registrationError)
			})
	})
}

// Axe accessibility audit in development
if (import.meta.env.DEV) {
	import('@axe-core/react').then((axe) => {
		axe.default(React, createRoot, 1000)
	})
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>
)
