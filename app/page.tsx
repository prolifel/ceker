'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { checkWebsiteLegitimacy } from './actions'

interface Result {
  isLegitimate: boolean
  message: string
  details: string[]
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    try {
      const checkResult = await checkWebsiteLegitimacy(url)
      setResult(checkResult)
    } catch (err) {
      setError('Failed to check website. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Website Checker
          </h1>
          <p className="text-slate-600">
            Verify if a website is legitimate or suspicious
          </p>
        </div>

        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Enter Website URL
              </label>
              <Input
                id="url"
                type="text"
                placeholder="https://example.com"
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
                  Checking...
                </>
              ) : (
                'Check Website'
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg border-2 ${
                result.isLegitimate
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.isLegitimate ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3
                    className={`font-semibold mb-1 ${
                      result.isLegitimate
                        ? 'text-green-900'
                        : 'text-red-900'
                    }`}
                  >
                    {result.message}
                  </h3>
                  <ul
                    className={`text-sm space-y-1 ${
                      result.isLegitimate
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}
                  >
                    {result.details.map((detail, idx) => (
                      <li key={idx}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-slate-600 mt-6">
          This checker uses multiple security indicators to assess website legitimacy
        </p>
      </div>
    </main>
  )
}
