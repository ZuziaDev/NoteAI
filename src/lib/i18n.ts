import { useMemo } from 'react'
import type { AppLanguage } from '../../shared/types/storage'
import { useAppearanceStore } from '../stores/appearanceStore'

export const localeByLanguage = (language: AppLanguage) =>
  language === 'en' ? 'en-US' : 'tr-TR'

export const pickByLanguage = <T>(
  language: AppLanguage,
  trValue: T,
  enValue: T,
): T => (language === 'en' ? enValue : trValue)

export const useI18n = () => {
  const language = useAppearanceStore((state) => state.settings.language)
  const locale = useMemo(() => localeByLanguage(language), [language])
  const t = useMemo(
    () =>
      <T,>(trValue: T, enValue: T): T =>
        pickByLanguage(language, trValue, enValue),
    [language],
  )

  return {
    language,
    locale,
    t,
    isEnglish: language === 'en',
  }
}
