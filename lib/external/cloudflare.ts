import { getVerdictByHash, isHashInGlobalCache } from '@/lib/repo/safebrowsing-cache'
import { scanAndWait } from '@/lib/repo/cloudflare-scanner'

export async function checkCloudflareRadar(sanitized: string, hash: string): Promise<{
  safe: boolean
  threatTypes?: string[]
  details?: string
  verdict?: string
}> {
  const verdict = await getVerdictByHash(hash)
  if (verdict != null) {
    console.log(`[checkCloudflareRadar][${sanitized}] Found in cache!`);

    let resp: any = {
      safe: verdict === 'SAFE',
      details: verdict === 'SAFE' ? "No threats detected." : 'Found in global harm cache',
      verdict: verdict
    }

    if (verdict != 'SAFE') {
      resp.threatTypes = [`${verdict}`]
    }

    return resp
  }

  try {
    const result = await scanAndWait(sanitized, 60)

    if (result.verdicts?.overall?.malicious) {
      return {
        safe: false,
        threatTypes: ['MALICIOUS'],
        details: 'Detected as malicious by URL Scanner',
        verdict: 'MALICIOUS'
      }
    }

    const phishing = result.meta?.processors?.phishing
    if (phishing && phishing.detected) {
      return {
        safe: false,
        threatTypes: ['PHISHING'],
        details: 'Phishing detected by URL Scanner',
        verdict: 'PHISHING'
      }
    }

    const radarRank = result.meta?.processors?.radarRank
    return {
      safe: true,
      details: `No threats detected. Rank: ${radarRank ?? 'N/A'}`,
      verdict: 'SAFE'
    }
  } catch (error) {
    console.error('Cloudflare Radar scan error:', error)
    return { safe: true, details: 'Scan unavailable', verdict: 'UNKNOWN' }
  }
}
