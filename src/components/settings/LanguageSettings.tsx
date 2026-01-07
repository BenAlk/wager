import { useTranslation } from '@/i18n/useTranslation'
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, type SupportedLanguage } from '@/i18n/constants'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Globe } from 'lucide-react'

export function LanguageSettings() {
	const { t, changeLanguage, currentLanguage } = useTranslation('settings')
	const { user } = useAuth()

	const handleLanguageChange = async (newLanguage: string) => {
		try {
			// Update i18next
			await changeLanguage(newLanguage)

			// Update database
			if (user?.id) {
				const { error } = await supabase
					.from('users')
					.update({ language_preference: newLanguage as SupportedLanguage })
					.eq('id', user.id)

				if (error) throw error
			}

			toast.success(t('toast:settings.languageUpdated'))
		} catch (error) {
			console.error('Error updating language:', error)
			toast.error(t('toast:settings.languageUpdateFailed'))
		}
	}

	return (
		<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
			<div className="flex items-center gap-3 mb-6">
				<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
					<Globe className="w-6 h-6 text-white" />
				</div>
				<h3 className="text-xl font-bold text-white">{t('language.title')}</h3>
			</div>

			<div>
				<Label className="text-slate-200">{t('language.selectLanguage')}</Label>
				<Select value={currentLanguage} onValueChange={handleLanguageChange} disabled>
					<SelectTrigger className="mt-2 w-full bg-white/5 border-white/10 text-white opacity-60 cursor-not-allowed">
						<SelectValue />
					</SelectTrigger>
					<SelectContent
						style={{
							backgroundColor: 'var(--modal-bg)',
							borderColor: 'var(--border-primary)',
						}}
					>
						{SUPPORTED_LANGUAGES.map((lang) => (
							<SelectItem
								key={lang}
								value={lang}
								style={{ color: 'var(--text-primary)' }}
								className='cursor-pointer hover:opacity-80'
							>
								{LANGUAGE_NAMES[lang]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="mt-2 flex items-center gap-2">
					<div className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
						<span className="text-xs font-medium text-amber-400">Coming Soon</span>
					</div>
					<p className="text-sm text-slate-400">
						Multi-language support is currently being translated
					</p>
				</div>
			</div>
		</div>
	)
}
