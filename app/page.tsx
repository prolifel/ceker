'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { ScreenshotDisplay } from '@/components/screenshot-display'
import { ProgressBar } from '@/components/progress-bar'
import { AnimatedCheckingText } from '@/components/animated-checking-text'
import { getUrlError, normalizeUrl } from '@/lib/utils/url'
import { useTranslation } from '@/lib/i18n/use-translation'

type RiskLevel = 'LEGITIMATE' | 'SUSPICIOUS' | 'WARNING'

interface Result {
  riskLevel: RiskLevel
  messageKey: string
  messageParams?: Record<string, string | number>
  details: Array<{ key: string; params?: Record<string, string | number> }>
  screenshotPath?: string
}

interface Prompt {
  message: string
  detail: string
  hostname: string
}

export default function Home() {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [prompt, setPrompt] = useState<Prompt | null>(null)

  const performCheck = async (bypassDomainCheck = false) => {
    setError('')
    setResult(null)
    setPrompt(null)
    setProgress(0)
    setProgressMessage('')

    // Validate URL format
    const urlError = getUrlError(url)
    if (urlError) {
      setError(t(urlError as any))
      return
    }

    setLoading(true)
    setProgress(0)
    setProgressMessage(t('startingScan'))

    // Normalize URL (add https:// if missing)
    const normalizedUrl = normalizeUrl(url)

    try {
      const response = await fetch('/api/check-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, bypassDomainCheck })
      })

      if (!response.ok) {
        throw new Error(t('failedToCheckWebsite'))
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error(t('noResponseBody'))
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6)
            if (!jsonStr.trim()) continue

            try {
              const data = JSON.parse(jsonStr)
              if (data.error) {
                throw new Error(data.message || t('scanFailed'))
              }
              if (data.prompt) {
                // Show prompt to user
                setPrompt(data.prompt)
                setProgress(data.percent)
                setProgressMessage(data.message || '')
              }
              if (data.percent !== undefined) {
                setProgress(data.percent)
                if (data.message) {
                  setProgressMessage(data.message)
                }
              }
              if (data.result) {
                setResult(data.result)
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      setError(t('failedToCheckWebsite'))
      console.error(err)
    } finally {
      setLoading(false)
      setProgress(0)
      setProgressMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await performCheck()
  }

  const handleContinueCheck = () => {
    performCheck(true)
  }

  const handleCancel = () => {
    setPrompt(null)
    setUrl('')
    setProgress(0)
    setProgressMessage('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-slate-600">
            {t('description')}
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                {t('enterUrl')}
              </label>
              <Input
                id="url"
                type="text"
                placeholder={t('urlPlaceholder')}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <AnimatedCheckingText />
                </>
              ) : (
                t('checkButton')
              )}
            </Button>

            {loading && progress > 0 && (
              <div className="mt-4">
                <ProgressBar percent={progress} message={progressMessage} />
              </div>
            )}
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {prompt && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">{prompt.message}</p>
                  <p className="text-sm text-yellow-700 mt-1">{prompt.detail}</p>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={handleContinueCheck} className="bg-yellow-600 hover:bg-yellow-700">
                      {t('yesContinue')}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                      {t('noCancel')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && result.screenshotPath && (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium text-slate-700">{t('websiteScreenshot')}</h4>
              <ScreenshotDisplay screenshot={result.screenshotPath} alt={t('websiteScreenshot')} />
            </div>
          )}

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                result.riskLevel === 'LEGITIMATE'
                  ? 'bg-green-50 border-green-200'
                  : result.riskLevel === 'SUSPICIOUS'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.riskLevel === 'LEGITIMATE' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : result.riskLevel === 'SUSPICIOUS' ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      result.riskLevel === 'LEGITIMATE'
                        ? 'text-green-900'
                        : result.riskLevel === 'SUSPICIOUS'
                        ? 'text-yellow-900'
                        : 'text-red-900'
                    }`}
                  >
                    {t(result.messageKey as any, result.messageParams)}
                  </h3>
                  <ul
                    className={`text-sm space-y-1 ${
                      result.riskLevel === 'LEGITIMATE'
                        ? 'text-green-800'
                        : result.riskLevel === 'SUSPICIOUS'
                        ? 'text-yellow-800'
                        : 'text-red-800'
                    }`}
                  >
                    {result.details.map((detail, idx) => (
                      <li key={idx}>• {t(detail.key as any, detail.params)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
