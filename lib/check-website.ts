import { getDomainByDomain } from "@/lib/repo/domain"
import { getTLD } from "@/lib/repo/tld"
import { getBlacklistByDomain } from "@/lib/repo/blacklist"
import { checkCloudflareRadar } from "@/lib/external/cloudflare"
import { sha256 } from "./shared/hash"
import { addHashToGlobalCache, addHashWithVerdict, getCacheEntry, updateScreenshotPath, updateVerdict, updateWhoisData } from "@/lib/repo/safebrowsing-cache"
import { captureScreenshot } from "./external/browserless"
import { saveScreenshot } from "./shared/storage"
import { checkWhois } from "./external/whois"
import { getRootDomain } from "@/lib/utils/domain"
import { validateTLD } from "@/lib/utils/tld"

export type RiskLevel = 'LEGITIMATE' | 'SUSPICIOUS' | 'WARNING'

export interface CheckResult {
  riskLevel: RiskLevel
  message: string
  details: string[]
  screenshotPath?: string
}

export interface CheckResultNotInDB {
  status: 'not_in_db'
  hostname: string
}

export interface CheckResultError {
  status: 'error'
  message: string
  details: string[]
  // Logging data
  hostname: string
}

export interface CheckResultSuccess {
  status: 'success'
  riskLevel: RiskLevel
  message: string
  details: string[]
  screenshotPath?: string
  // Logging data
  hostname: string
  cloudflareVerdict?: string
  domainAgeDays?: number
  domainExpires?: Date
  domainRegistrar?: string
}

export type CheckResultV2 = CheckResultNotInDB | CheckResultError | CheckResultSuccess

// Optional flag to bypass domain check (when user confirms "Yes")
interface CheckOptions {
  bypassDomainCheck?: boolean
}

type ProgressCallback = (percent: number, message: string) => void

export async function checkWebsiteLegitimacy(
  urlString: string,
  onProgress?: ProgressCallback,
  options?: CheckOptions
): Promise<CheckResultV2> {
  urlString = urlString.trim()

  const details: string[] = []

  // Parse and validate URL
  let url: URL
  try {
    const normalizedUrl = urlString.includes('://')
      ? urlString
      : `https://${urlString}`
    url = new URL(normalizedUrl)
    onProgress?.(5, 'URL validated')
  } catch {
    return {
      status: 'error',
      message: 'Invalid URL Format',
      details: ['The URL you entered is not in a valid format.'],
      hostname: urlString,
    }
  }

  // Check for common phishing indicators
  const hostname = url.hostname.toLowerCase()
  console.log(`Checking: ${url.toString()}`)

  // === TLD VALIDATION (EARLY EXIT) ===
  onProgress?.(10, 'Validating domain extension...')
  const tldValidation = await validateTLD(hostname)
  if (!tldValidation.valid) {
    return {
      status: 'error',
      message: 'Invalid URL',
      details: [tldValidation.reason || 'The domain extension is invalid.'],
      hostname,
    }
  }

  // === CHECK 1: Legitimate Domain List (EARLY EXIT or PROMPT) ===
  onProgress?.(15, 'Checking legitimate domain list...')
  const legitimateDomain = await getDomainByDomain(hostname)
  if (legitimateDomain != null) {
    onProgress?.(100, 'Complete')
    return {
      status: 'success',
      riskLevel: 'LEGITIMATE',
      message: '✓ Appears to be a Legitimate Website',
      details: ['✓ Website is available in our legitimate website list'],
      hostname,
    }
  }

  // === CHECK 2: Blacklist Check (AFTER legitimate domain check) ===
  onProgress?.(20, 'Checking blacklist...')
  const blacklistEntry = await getBlacklistByDomain(hostname)
  if (blacklistEntry != null) {
    onProgress?.(100, 'Complete')
    return {
      status: 'success',
      riskLevel: 'WARNING',
      message: '⚠️ WARNING - Known Phishing Website',
      details: ['⚠️ This website is in our blacklist of known phishing sites'],
      hostname,
    }
  }

  // If domain not in database and not bypassing, prompt user
  if (!options?.bypassDomainCheck) {
    return {
      status: 'not_in_db',
      hostname
    }
  }

  // Calculate hash for caching
  const hash = await sha256(url.toString())

  // Check cache first
  const cacheEntry = await getCacheEntry(hash)
  const isCacheValid = cacheEntry && cacheEntry?.verdict != 'UNKNOWN' && (cacheEntry.expires_at && new Date() < cacheEntry.expires_at)

  // Track flags for 3-tier classification
  let passedCloudflare = false
  let cloudflareVerdict: string = 'UNKNOWN'

  // URL Scanner check
  onProgress?.(20, 'Scanning with URL Scanner...')
  if (isCacheValid) {
    console.log(`[Cloudflare Radar][${url.toString()}] Cache is valid`);

    cloudflareVerdict = cacheEntry?.verdict || 'UNKNOWN'
    if (cloudflareVerdict == 'MALICIOUS' || cloudflareVerdict == 'PHISHING') {
      details.push(`⚠️ URL Scanner detected threats: ${cloudflareVerdict}.`)
    } else if (cloudflareVerdict == 'SAFE') {
      passedCloudflare = true
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
      cloudflareVerdict = verdict
      console.log(`Verdict: ${verdict}`);

      if (cacheEntry) {
        await updateVerdict(hash, verdict)
      } else {
        await addHashWithVerdict(hash, verdict)
      }

      if (!cloudflareRadarResult.safe && !cloudflareRadarResult.unlisted) {
        details.push(`⚠️ URL Scanner detected threats: ${cloudflareRadarResult.threatTypes?.join(', ')}. ${cloudflareRadarResult.details}`)
      } else if (cloudflareRadarResult.unlisted) {
        details.push(`ℹ️ The URL is not registered in internal website.`)
      } else {
        passedCloudflare = true
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

  // Check 1: TLD validation
  // Extract TLD from hostname (e.g., .com, .org, .co.uk)
  const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf']
  const tldMatch = hostname.match(/\.([a-z]{2,63})$/i)
  const tld = tldMatch ? `.${tldMatch[1].toLowerCase()}` : null

  let unusualTLD = false

  if (tld && suspiciousTLDs.some((suspicious) => tld === suspicious)) {
    unusualTLD = true
    details.push('⚠️ Uses a free/suspicious top-level domain')
  } else if (tld) {
    // Check if TLD is valid (in database)
    const tldExists = await getTLD(tld)
    if (tldExists) {
      details.push('✓ Uses a standard domain extension')
    } else {
      unusualTLD = true
      details.push('⚠️ The domain extension is unknown')
    }
  } else {
    unusualTLD = true
    details.push('⚠️ The domain extension is unknown')
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
    details.push('⚠️ Domain contains common phishing keywords')
  }

  // Check 3: HTTPS verification + Reachability check (merged)
  let isReachable = false
  const usesHttps = url.protocol === 'https:'

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url.toString(), {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    isReachable = response.ok || response.status < 400
  } catch (error) {
    // Website not reachable
    isReachable = false
  }

  // Report combined HTTPS + reachability status
  if (isReachable && usesHttps) {
    details.push('✓ Website is reachable, responding, and using secure connection')
  } else if (isReachable && !usesHttps) {
    details.push('⚠️ Website is reachable, but not using secure connection')
  } else if (!isReachable && usesHttps) {
    details.push('⚠️ Website cannot be reached')
  } else {
    details.push('⚠️ Website could not be reached')
  }

  // Check 4: Subdomain check
  const subdomainHeavy = hostname.split('.').length > 3
  if (subdomainHeavy) {
    details.push('⚠️ Domain structure seems unusual (subdomain heavy)')
  }

  // Check 7: WHOIS domain age analysis
  onProgress?.(75, 'Checking domain registration information...')

  // Extract root domain for WHOIS lookup (e.g., web.whatsapp.com → whatsapp.com)
  const rootDomain = getRootDomain(hostname)
  const domainSuffix = rootDomain !== hostname ? ` (${rootDomain})` : ''

  let domainAge: number | null = null

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
    domainAge = cacheEntry.domain_age_days
  } else {
    console.log(`[whoisjs.com][${hostname}] Cache is not valid, fetching fresh data for ${rootDomain}`)
    const freshWhoisData = await checkWhois(rootDomain)
    whoisData = freshWhoisData
    domainAge = freshWhoisData.domainAge

    // Update cache with WHOIS data
    if (!cacheEntry) {
      await addHashToGlobalCache(hash)
    }
    await updateWhoisData(hash, {
      created: freshWhoisData.created,
      expires: freshWhoisData.expires,
      registrar: freshWhoisData.registrar,
      abuseContact: freshWhoisData.abuseContact,
      domainAge: freshWhoisData.domainAge,
    })
  }

  if (domainAge !== null) {
    const daysOld = domainAge
    details.push(`✓ Domain is ${daysOld} days old${domainSuffix}`)
  } else {
    details.push(`ℹ️ Domain age information unavailable${domainSuffix}`)
  }

  // Check domain expiration
  if (whoisData.expires) {
    const daysUntilExpiry = Math.floor((whoisData.expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (daysUntilExpiry < 30) {
      details.push(`⚠️ Domain expires soon (${daysUntilExpiry} days)`)
    }
  }

  // Display abuse contact information (informational only)
  if (whoisData.abuseContact) {
    details.push(`ℹ️ Abuse contact: ${whoisData.abuseContact}`)
  }

  // === 3-TIER CLASSIFICATION ===
  // Determine risk level based on collected flags
  // Priority order: domain age (highest) -> TLD/subdomain -> HTTPS -> Cloudflare (lowest)
  let riskLevel: RiskLevel = 'LEGITIMATE'
  let message = '✓ Appears to be a Legitimate Website'

  if (domainAge !== null && domainAge < 20) {
    // Very new domain (< 20 days) - Warning - HIGHEST PRIORITY
    riskLevel = 'WARNING'
    message = '⚠️ High Risk - Very New Domain'
  } else if (unusualTLD && subdomainHeavy) {
    // Unusual TLD + subdomain heavy - Warning
    riskLevel = 'WARNING'
    message = '⚠️ High Risk - Suspicious Domain Structure'
  } else if (unusualTLD) {
    // Unusual TLD alone - Warning
    riskLevel = 'WARNING'
    message = '⚠️ High Risk - Unusual Domain Extension'
  } else if (!usesHttps) {
    // Not using HTTPS - Warning
    riskLevel = 'WARNING'
    message = '⚠️ High Risk - Not Using Secure Connection'
  } else if (domainAge !== null && domainAge < 90) {
    // New domain (< 90 days) - Suspicious
    riskLevel = 'SUSPICIOUS'
    message = '⚠️ Suspicious - Recently Registered Domain'
  } else if (subdomainHeavy) {
    // Subdomain heavy - Suspicious
    riskLevel = 'SUSPICIOUS'
    message = '⚠️ Suspicious - Unusual Domain Structure'
  } else if (passedCloudflare) {
    // Passed Cloudflare Radar - Legitimate (only if above checks pass)
    riskLevel = 'LEGITIMATE'
    message = '✓ Appears to be a Legitimate Website'
  } else {
    // Default for established domains without Cloudflare check
    riskLevel = 'LEGITIMATE'
    message = '✓ Appears to be a Legitimate Website'
  }

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
    status: 'success',
    riskLevel,
    message,
    details,
    screenshotPath,
    hostname,
    cloudflareVerdict,
    domainAgeDays: domainAge ?? undefined,
    domainExpires: whoisData?.expires ?? undefined,
    domainRegistrar: whoisData?.registrar ?? undefined,
  }
}
