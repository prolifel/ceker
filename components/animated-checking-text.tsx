'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/use-translation'

export function AnimatedCheckingText() {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const MESSAGES = [
    t('checking'),
    t('analyzingUrl'),
    t('scanningForThreats'),
    t('almostDone'),
    t('kindlyWait'),
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % MESSAGES.length)
        setIsAnimating(false)
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [t])

  return (
    <span className="inline-block">
      <span
        className={`inline-block transition-all duration-300 ${isAnimating
            ? 'transform -translate-y-full opacity-0'
            : 'transform translate-y-0 opacity-100'
          }`}
      >
        {MESSAGES[currentIndex]}
      </span>
    </span>
  )
}
