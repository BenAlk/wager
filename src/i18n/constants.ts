export const DEFAULT_LANGUAGE = 'en'

export const SUPPORTED_LANGUAGES = [
	'en', // English
	'pl', // Polish
	'ro', // Romanian
	'es', // Spanish
	'pt', // Portuguese
	'de', // German
	'fr', // French
	'ar', // Arabic
	'bg', // Bulgarian
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
	en: 'English',
	pl: 'Polski',
	ro: 'Română',
	es: 'Español',
	pt: 'Português',
	de: 'Deutsch',
	fr: 'Français',
	ar: 'العربية',
	bg: 'Български',
}

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar']
