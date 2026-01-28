import { NextRequest } from 'next/server'
import { checkWebsiteLegitimacy } from '@/lib/check-website'
import { sendTeamsNotification } from '@/lib/services/teams'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url } = body

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

        const result = await checkWebsiteLegitimacy(url, onProgress)

        // Send Teams notification (non-blocking)
        sendTeamsNotification(result, url).catch(err => {
          console.error('Teams notification failed:', err)
        })

        const finalData = `data: ${JSON.stringify({ percent: 100, result })}\n\n`
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
