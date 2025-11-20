import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: [
				'icon.svg',
				'apple-touch-icon.png',
				'icons/*.png',
			],
			manifest: {
				name: 'Wager - Courier Pay Tracker',
				short_name: 'Wager',
				description:
					'Track your Amazon DSP courier pay including bonuses, sweeps, mileage, and van costs',
				theme_color: '#3b82f6',
				background_color: '#0f172a',
				display: 'standalone',
				orientation: 'portrait-primary',
				start_url: '/',
				icons: [
					{
						src: '/icons/icon-72x72.png',
						sizes: '72x72',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icons/icon-96x96.png',
						sizes: '96x96',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icons/icon-128x128.png',
						sizes: '128x128',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icons/icon-144x144.png',
						sizes: '144x144',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icons/icon-152x152.png',
						sizes: '152x152',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icons/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable',
					},
					{
						src: '/icons/icon-384x384.png',
						sizes: '384x384',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icons/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
				categories: ['finance', 'productivity', 'business'],
			},
			workbox: {
				// Cache strategy
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'supabase-cache',
							expiration: {
								maxEntries: 50,
								maxAgeSeconds: 60 * 60 * 24, // 24 hours
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp)$/,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'static-resources',
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
						},
					},
				],
				// Don't cache these routes
				navigateFallback: '/index.html',
				navigateFallbackDenylist: [/^\/api/],
			},
			devOptions: {
				enabled: true, // Enable in dev mode for testing
				type: 'module',
			},
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
})
