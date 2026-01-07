import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, RTL_LANGUAGES } from './constants'

i18n
	.use(Backend) // Load translations via HTTP
	.use(initReactI18next) // React integration
	.init({
		fallbackLng: DEFAULT_LANGUAGE, // 'en'
		supportedLngs: SUPPORTED_LANGUAGES,
		defaultNS: 'common',
		ns: [
			'common',
			'auth',
			'onboarding',
			'calendar',
			'week-summary',
			'van',
			'vanManagement',
			'settings',
			'dashboard',
			'validation',
			'toast',
			'domain',
		],

		interpolation: {
			escapeValue: false, // React already escapes
		},

		backend: {
			loadPath: '/locales/{{lng}}/{{ns}}.json',
		},

		detection: {
			order: ['localStorage'],
			caches: ['localStorage'],
			lookupLocalStorage: 'wager_language',
		},

		react: {
			useSuspense: true, // Use Suspense for loading
		},

		// Development options
		debug: false,
		saveMissing: import.meta.env.DEV,
		returnEmptyString: false,
	})

// Set document direction for RTL languages (Arabic)
i18n.on('languageChanged', (lng) => {
	document.documentElement.dir = RTL_LANGUAGES.includes(lng as any) ? 'rtl' : 'ltr'
	document.documentElement.lang = lng
})

export default i18n
