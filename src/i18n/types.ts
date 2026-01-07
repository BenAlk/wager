// Namespace types for type-safe translations
export type Namespace =
	| 'common'
	| 'auth'
	| 'onboarding'
	| 'calendar'
	| 'week-summary'
	| 'van'
	| 'vanManagement'
	| 'settings'
	| 'dashboard'
	| 'validation'
	| 'toast'
	| 'domain'

export interface TranslationKeys {
	namespace: Namespace
}
