'use client'

import { createContext, useContext } from 'react'
import type { Locale, Translations } from './translations'
import { translations } from './translations'

interface I18nContextValue {
  locale: Locale
  t: <K extends keyof Translations>(
    key: K,
    params?: Record<string, string | number>
  ) => string
}

export const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export function useI18nContext() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider')
  }
  return context
}

// Client-side translation function
export function t(
  locale: Locale,
  key: keyof Translations,
  params?: Record<string, string | number>
): string {
  const translation = translations[locale][key]

  if (!params) {
    return translation
  }

  // Replace {key} placeholders with actual values
  return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
    return params[paramKey]?.toString() || match
  })
}
