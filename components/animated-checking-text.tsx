'use client'

import { useState, useEffect } from 'react'

const MESSAGES = [
  'Checking...',
  'Analyzing URL...',
  'Scanning for threats...',
  'Almost done...',
  'Kindly wait for a second...',
]

export function AnimatedCheckingText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % MESSAGES.length)
        setIsAnimating(false)
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

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
