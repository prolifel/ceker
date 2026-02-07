'use client'

import { useI18nContext } from './context'
import type { Translations } from './translations'

export function useTranslation() {
  const { locale, t } = useI18nContext()

  return {
    locale,
    t: t as <K extends keyof Translations>(
      key: K,
      params?: Record<string, string | number>
    ) => string,
  }
}
