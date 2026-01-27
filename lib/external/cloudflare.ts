import { sanitizeUrl } from '@/lib/shared/url'
import { sha256 } from '@/lib/shared/hash'
import { isHashInGlobalCache, addHashesToGlobalCache } from '@/lib/repo/safebrowsing-cache'
import { scanAndWait } from '@/lib/repo/cloudflare-scanner'

export async function checkCloudflareRadar(url: string): Promise<{
  safe: boolean
  threatTypes?: string[]
  details?: string
}> {
  const sanitized = sanitizeUrl(url)

  console.log('Scanning:', sanitized)

  const hash = await sha256(sanitized)

  if (await isHashInGlobalCache(hash)) {
    return { safe: false, threatTypes: ['MALICIOUS'], details: 'Found in global harm cache' }
  }

  try {
    const result = await scanAndWait(sanitized, 60)

    if (result.verdicts?.overall?.malicious) {
      await addHashesToGlobalCache([hash])

      return {
        safe: false,
        threatTypes: ['MALICIOUS'],
        details: 'Detected as malicious by URL Scanner'
      }
    }

    const phishing = result.meta?.processors?.phishing
    if (phishing && phishing.detected) {
      await addHashesToGlobalCache([hash])

      return {
        safe: false,
        threatTypes: ['PHISHING'],
        details: 'Phishing detected by URL Scanner'
      }
    }

    await addHashesToGlobalCache([hash])

    const radarRank = result.meta?.processors?.radarRank
    return {
      safe: true,
      details: `No threats detected. Rank: ${radarRank ?? 'N/A'}`
    }
  } catch (error) {
    console.error('Cloudflare Radar scan error:', error)
    return { safe: true, details: 'Scan unavailable' }
  }
}
