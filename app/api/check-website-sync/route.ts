import { NextRequest, NextResponse } from 'next/server'
import { checkWebsiteLegitimacy } from '@/lib/check-website'

// API Key for bot authentication
const BOT_API_KEY = process.env.BOT_API_KEY || ''

function authenticate(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key')
  return apiKey === BOT_API_KEY
}

export async function POST(request: NextRequest) {
  // Check authentication
  if (!authenticate(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Run the check without progress callback
    const result = await checkWebsiteLegitimacy(url)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[check-website-sync] Error:', error)
    return NextResponse.json(
      { error: 'Scan failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
