import { getDomainByDomain } from "@/lib/repo/domain"
import { checkCloudflareRadar } from "@/lib/external/cloudflare"
import { sha256 } from "./shared/hash"
import { addHashToGlobalCache, addHashWithVerdict, getCacheEntry, updateScreenshotPath, updateVerdict, updateWhoisData } from "@/lib/repo/safebrowsing-cache"
import { captureScreenshot } from "./external/browserless"
import { saveScreenshot } from "./shared/storage"
import { checkWhois } from "./external/whois"
import { getRootDomain } from "@/lib/utils/domain"

export interface CheckResult {
  isLegitimate: boolean
  message: string
  details: string[]
  screenshotPath?: string
}

type ProgressCallback = (percent: number, message: string) => void

export async function checkWebsiteLegitimacy(
  urlString: string,
  onProgress?: ProgressCallback
): Promise<CheckResult> {
  urlString = urlString.trim()

  const details: string[] = []

  // Parse and validate URL
  let url: URL
  try {
    const normalizedUrl = urlString.includes('://')
      ? urlString
      : `https://${urlString}`
    url = new URL(normalizedUrl)
    onProgress?.(10, 'URL validated')
  } catch {
    return {
      isLegitimate: false,
      message: 'Invalid URL Format',
      details: ['The URL you entered is not in a valid format.'],
    }
  }

  // Check for common phishing indicators
  const hostname = url.hostname.toLowerCase()
  console.log(`Checking: ${url.toString()}`);

  const hash = await sha256(url.toString())

  // === CHECK 1: Legitimate Domain List (EARLY EXIT) ===
  onProgress?.(15, 'Checking legitimate domain list...')
  const legitimateDomain = await getDomainByDomain(hostname)
  if (legitimateDomain != null) {
    onProgress?.(100, 'Complete')
    return {
      isLegitimate: true,
      message: '✓ Appears to be a Legitimate Website',
      details: ['✓ Website is available in our legitimate website list'],
    }
  }

  // Check cache first
  const cacheEntry = await getCacheEntry(hash)
  const isCacheValid = cacheEntry && cacheEntry?.verdict != 'UNKNOWN' && (cacheEntry.expires_at && new Date() < cacheEntry.expires_at)

  let suspicionScore = 0

  // URL Scanner check
  onProgress?.(20, 'Scanning with URL Scanner...')
  if (isCacheValid) {
    console.log(`[Cloudflare Radar][${url.toString()}] Cache is valid`);

    if (cacheEntry?.verdict == 'MALICIOUS' || cacheEntry?.verdict == 'PHISHING') {
      suspicionScore += 5
      details.push(`⚠️ URL Scanner detected threats: ${cacheEntry?.verdict}.`)
    } else if (cacheEntry?.verdict == 'SAFE') {
      details.push(`✓ Passed URL Scanner check`)
    } else {
      details.push(`⚠️ URL Scanner not available`)
    }

    onProgress?.(50, 'URL Scanner scan complete')
  } else {
    console.log(`[Cloudflare Radar][${url.toString()}] Cache is not valid`);

    let verdict = 'UNKNOWN'
    try {
      const cloudflareRadarResult = await checkCloudflareRadar(url.toString())
      onProgress?.(50, 'URL Scanner scan complete')

      verdict = cloudflareRadarResult.verdict || 'UNKNOWN'
      console.log(`Verdict: ${verdict}`);

      if (cacheEntry) {
        await updateVerdict(hash, verdict)
      } else {
        await addHashWithVerdict(hash, verdict)
      }

      if (!cloudflareRadarResult.safe && !cloudflareRadarResult.unlisted) {
        suspicionScore += 5
        details.push(`⚠️ URL Scanner detected threats: ${cloudflareRadarResult.threatTypes?.join(', ')}. ${cloudflareRadarResult.details}`)
      } else if (cloudflareRadarResult.unlisted) {
        details.push(`ℹ️ The URL is unlisted`)
      } else {
        details.push(`✓ Passed URL Scanner check`)
      }
    } catch (error) {
      onProgress?.(50, 'URL Scanner scan complete')
      console.error('URL Scanner check failed:', error)
      details.push(`ℹ️ URL Scanner check unavailable`)
      if (cacheEntry) {
        await updateVerdict(hash, verdict)
      } else {
        await addHashWithVerdict(hash, verdict)
      }
    }
  }

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
    details.push('✓ Uses secure connection')
  } else {
    suspicionScore += 3
    details.push('⚠️ Does not use encryption')
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
      details.push('⚠️ Website cannot be reached')
    } else {
      suspicionScore += 1
      details.push('⚠️ Website could not be reached')
    }
  }

  if (isReachable && url.protocol === 'https:') {
    details.push('✓ Website is reachable and responding')
  }

  // Check 5: Domain age consideration (basic heuristic)
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

  // Check 7: WHOIS domain age analysis
  onProgress?.(75, 'Checking domain registration information...')

  // Extract root domain for WHOIS lookup (e.g., web.whatsapp.com → whatsapp.com)
  const rootDomain = getRootDomain(hostname)
  const domainSuffix = rootDomain !== hostname ? ` (${rootDomain})` : ''

  let whoisData
  if (isCacheValid && cacheEntry?.domain_age_days != null) {
    console.log(`[whoisjs.com][${hostname}] Cache is valid`)
    whoisData = {
      domainAge: cacheEntry.domain_age_days,
      expires: cacheEntry.domain_expires,
      created: cacheEntry.domain_created,
      registrar: cacheEntry.domain_registrar,
      abuseContact: cacheEntry.abuse_contact,
    }
  } else {
    console.log(`[whoisjs.com][${hostname}] Cache is not valid, fetching fresh data for ${rootDomain}`)
    const freshWhoisData = await checkWhois(rootDomain)
    whoisData = freshWhoisData

    // Update cache with WHOIS data
    if (cacheEntry) {
      await updateWhoisData(hash, {
        created: freshWhoisData.created,
        expires: freshWhoisData.expires,
        registrar: freshWhoisData.registrar,
        abuseContact: freshWhoisData.abuseContact,
        domainAge: freshWhoisData.domainAge,
      })
    }
  }

  if (whoisData.domainAge !== null) {
    const daysOld = whoisData.domainAge!
    if (daysOld < 30) {
      suspicionScore += 3
      details.push(`⚠️ Domain is very new (${daysOld} days old)${domainSuffix}`)
    } else {
      details.push(`✓ Domain is established (${daysOld} days old)${domainSuffix}`)
    }
  } else {
    details.push(`ℹ️ Domain age information unavailable${domainSuffix}`)
  }

  // Check domain expiration
  if (whoisData.expires) {
    const daysUntilExpiry = Math.floor((whoisData.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry < 30) {
      suspicionScore += 1
      details.push(`⚠️ Domain expires soon (${daysUntilExpiry} days)`)
    }
  }

  // Display abuse contact information (informational only)
  if (whoisData.abuseContact) {
    details.push(`ℹ️ Abuse contact: ${whoisData.abuseContact}`)
  }

  // Determine legitimacy based on suspicion score
  const isLegitimate = suspicionScore < 4

  // Capture screenshot (with caching)
  onProgress?.(80, 'Capturing screenshot...')
  let screenshotPath
  if (isCacheValid && cacheEntry?.screenshot_path) {
    console.log(`[Browserless][${url.toString()}] Cache is valid`);

    screenshotPath = cacheEntry.screenshot_path
  } else {
    try {
      console.log(`[Browserless][${url.toString()}] Cache is not valid`);
      const base64Screenshot = await captureScreenshot(url.toString())
      if (!base64Screenshot) {
        screenshotPath = undefined
      } else {
        screenshotPath = await saveScreenshot(base64Screenshot, hash)
        if (!cacheEntry) {
          await addHashToGlobalCache(hash)
        }
        await updateScreenshotPath(hash, screenshotPath)
      }
    } catch (error) {
      console.error(error)
      screenshotPath = undefined
    }
  }

  onProgress?.(100, 'Complete')

  return {
    isLegitimate,
    message: isLegitimate
      ? '✓ Appears to be a Legitimate Website'
      : '⚠️ Website Shows Suspicious Signs',
    details,
    screenshotPath,
  }
}
