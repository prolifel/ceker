import { NextRequest } from 'next/server'
import { checkWebsiteLegitimacy } from '@/lib/check-website'
import { sendTeamsNotification } from '@/lib/services/teams'
import { createRequestLog } from '@/lib/repo/request-logs'

function getClientIp(request: NextRequest): string {
  // Try various headers for IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { url, bypassDomainCheck } = body

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Extract client info for logging
  const ipAddress = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || undefined

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const onProgress = (percent: number, message: string) => {
          const data = `data: ${JSON.stringify({ percent, message })}\n\n`
          controller.enqueue(encoder.encode(data))
        }

        const result = await checkWebsiteLegitimacy(url, onProgress, { bypassDomainCheck })

        // Log the request to database
        const hostname = result.hostname

        // Handle different response types
        if (result.status === 'not_in_db') {
          // Log the 'not_in_db' status
          await createRequestLog({
            url,
            hostname,
            scan_status: 'not_in_db',
            bypass_domain_check: bypassDomainCheck,
            ip_address: ipAddress,
            user_agent: userAgent,
          })

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
          // Log the error
          await createRequestLog({
            url,
            hostname,
            message: result.message,
            details: result.details,
            scan_status: 'error',
            bypass_domain_check: bypassDomainCheck,
            ip_address: ipAddress,
            user_agent: userAgent,
          })

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

        // Success - log the full result
        await createRequestLog({
          url,
          hostname,
          risk_level: result.riskLevel,
          message: result.message,
          details: result.details,
          screenshot_path: result.screenshotPath,
          scan_status: 'success',
          bypass_domain_check: bypassDomainCheck,
          cloudflare_verdict: result.cloudflareVerdict,
          domain_age_days: result.domainAgeDays,
          domain_expires: result.domainExpires,
          domain_registrar: result.domainRegistrar,
          ip_address: ipAddress,
          user_agent: userAgent,
        })

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
        // Log the exception
        try {
          const urlObj = new URL(url.includes('://') ? url : `https://${url}`)
          await createRequestLog({
            url,
            hostname: urlObj.hostname,
            message: error instanceof Error ? error.message : 'Unknown error',
            details: ['Scan failed with exception'],
            scan_status: 'error',
            bypass_domain_check: bypassDomainCheck,
            ip_address: getClientIp(request),
            user_agent: request.headers.get('user-agent') || undefined,
          })
        } catch (logError) {
          console.error('Failed to log error:', logError)
        }

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
