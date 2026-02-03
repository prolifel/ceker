interface ScanSubmission {
  uuid: string
  url: string
  message: string
}

interface ScanResult {
  task: {
    uuid: string
    url: string
    success: boolean
    status: string
    visibility?: string
  }
  verdicts?: {
    overall?: {
      malicious: boolean
    }
  }
  meta?: {
    processors?: {
      phishing?: any
      domainCategories?: any
      radarRank?: number
    }
  }
}

export async function submitScan(url: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare credentials not configured')
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/scan`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        visibility: 'Unlisted'
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudflare scan submission failed: ${response.status}. ${errorText}`)
  }

  const data: ScanSubmission = await response.json()
  return data.uuid
}

export async function getScanResult(scanId: string): Promise<ScanResult | null> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/result/${scanId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`
      }
    }
  )

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cloudflare scan result failed: ${response.status}. ${errorText}`)
  }

  return response.json()
}

export async function scanAndWait(url: string, maxWaitSeconds: number = 30): Promise<ScanResult> {
  const scanId = await submitScan(url)

  const startTime = Date.now()
  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    await new Promise(resolve => setTimeout(resolve, 2000))

    const result = await getScanResult(scanId)

    if (result && result.task.status === 'finished') {
      return result
    }
  }

  throw new Error('Scan timeout')
}
