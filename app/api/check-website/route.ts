import { NextRequest } from 'next/server'
import { checkWebsiteLegitimacy } from '@/lib/check-website'
import { sendTeamsNotification } from '@/lib/services/teams'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, bypassDomainCheck } = body

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const onProgress = (percent: number, message: string) => {
          const data = `data: ${JSON.stringify({ percent, message })}\n\n`
          controller.enqueue(encoder.encode(data))
        }

        const result = await checkWebsiteLegitimacy(url, onProgress, { bypassDomainCheck })

        // Handle different response types
        if (result.status === 'not_in_db') {
          // Domain not found in database - prompt user
          const promptData = `data: ${JSON.stringify({
            percent: 15,
            prompt: {
              message: 'Domain not found in our database.',
              detail: 'Do you want to continue checking the public web?',
              hostname: result.hostname
            }
          })}\n\n`
          controller.enqueue(encoder.encode(promptData))
          controller.close()
          return
        }

        if (result.status === 'error') {
          // Error response
          const errorData = `data: ${JSON.stringify({
            percent: 100,
            result: {
              riskLevel: 'WARNING',
              message: result.message,
              details: result.details
            }
          })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
          return
        }

        // Success response - format for frontend compatibility
        const successResult = {
          riskLevel: result.riskLevel,
          message: result.message,
          details: result.details,
          screenshotPath: result.screenshotPath
        }

        // Send Teams notification (non-blocking)
        sendTeamsNotification(successResult, url).catch(err => {
          console.error('Teams notification failed:', err)
        })

        const finalData = `data: ${JSON.stringify({ percent: 100, result: successResult })}\n\n`
        controller.enqueue(encoder.encode(finalData))
        controller.close()
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ error: 'Scan failed', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
        controller.enqueue(encoder.encode(errorData))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
