'use server'

interface CheckResult {
  isLegitimate: boolean
  message: string
  details: string[]
}

export async function checkWebsiteLegitimacy(
  urlString: string
): Promise<CheckResult> {
  const details: string[] = []

  // Parse and validate URL
  let url: URL
  try {
    const normalizedUrl = urlString.includes('://')
      ? urlString
      : `https://${urlString}`
    url = new URL(normalizedUrl)
  } catch {
    return {
      isLegitimate: false,
      message: 'Invalid URL Format',
      details: ['The URL you entered is not in a valid format.'],
    }
  }

  // Check for common phishing indicators
  const hostname = url.hostname.toLowerCase()
  let suspicionScore = 0

  // Check 1: Suspicious TLDs
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf']
  if (suspiciousTLDs.some((tld) => hostname.endsWith(tld))) {
    suspicionScore += 2
    details.push('⚠️ Uses a free/suspicious top-level domain')
  } else {
    details.push('✓ Uses a standard domain extension')
  }

  // Check 2: Check for common phishing patterns
  const phishingKeywords = [
    'verify',
    'confirm',
    'update',
    'secure',
    'account',
    'login',
    'urgent',
  ]
  const hostnameHasPhishingKeywords = phishingKeywords.some(
    (keyword) =>
      hostname.includes(keyword) &&
      !['verify.com', 'confirm.io'].includes(hostname)
  )

  if (hostnameHasPhishingKeywords) {
    suspicionScore += 1
    details.push('⚠️ Domain contains common phishing keywords')
  }

  // Check 3: HTTPS verification
  if (url.protocol === 'https:') {
    details.push('✓ Uses secure HTTPS connection')
  } else {
    suspicionScore += 3
    details.push('⚠️ Does not use HTTPS encryption')
  }

  // Check 4: Try to fetch the website
  let isReachable = false
  let hasValidSSL = false

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url.toString(), {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    isReachable = response.ok || response.status < 400
    hasValidSSL = true
  } catch (error) {
    if (url.protocol === 'https:') {
      suspicionScore += 2
      details.push('⚠️ Website cannot be reached or has SSL issues')
    } else {
      suspicionScore += 1
      details.push('⚠️ Website could not be reached')
    }
  }

  if (isReachable && url.protocol === 'https:') {
    details.push('✓ Website is reachable and responding')
  }

  // Check 5: Domain age consideration (basic heuristic)
  // In a real scenario, you'd use a WHOIS API
  if (hostname.split('.').length > 3) {
    suspicionScore += 1
    details.push('⚠️ Domain structure seems unusual (subdomain heavy)')
  }

  // Check 6: Check for IP address instead of domain
  if (/^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    suspicionScore += 3
    details.push('⚠️ Uses IP address instead of domain name')
  } else {
    details.push('✓ Uses proper domain name')
  }

  // Determine legitimacy based on suspicion score
  const isLegitimate = suspicionScore < 3

  return {
    isLegitimate,
    message: isLegitimate
      ? '✓ Appears to be a Legitimate Website'
      : '⚠️ Website Shows Suspicious Signs',
    details,
  }
}
