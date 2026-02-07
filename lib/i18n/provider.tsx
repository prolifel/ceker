'use client'

import { type Locale, type Translations } from './translations'
import { I18nContext, t } from './context'

interface I18nProviderProps {
  children: React.ReactNode
  initialLocale: Locale
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const locale: Locale = initialLocale

  const value = {
    locale,
    t: (key: keyof Translations, params?: Record<string, string | number>) =>
      t(locale, key, params),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
