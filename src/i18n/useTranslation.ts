import { useTranslation as useI18nTranslation } from 'react-i18next'
import type { Namespace } from './types'

// Strongly-typed translation hook wrapper
export function useTranslation(namespace?: Namespace) {
	const { t, i18n } = useI18nTranslation(namespace)

	return {
		t: t as (key: string, options?: object) => string,
		i18n,
		currentLanguage: i18n.language,
		changeLanguage: (lang: string) => i18n.changeLanguage(lang),
	}
}
