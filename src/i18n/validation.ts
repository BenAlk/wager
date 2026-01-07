import i18n from './index'

// Helper for explicit translation keys in validation schemas
export function t(key: string, params?: Record<string, unknown>): string {
	return i18n.t(`validation:${key}`, params) as string
}

// Note: Zod error map integration will be added in Phase 2
// For now, use the t() helper in validation schemas
