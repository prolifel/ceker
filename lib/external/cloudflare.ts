import { addHashWithVerdict } from '@/lib/repo/safebrowsing-cache'
import { scanAndWait } from '@/lib/repo/cloudflare-scanner'

export async function checkCloudflareRadar(sanitized: string, hash: string): Promise<{
  safe: boolean
  threatTypes?: string[]
  details?: string
  verdict?: string
}> {
  try {
    const result = await scanAndWait(sanitized, 60)

    let scanVerdict = 'SAFE'
    let scanSafe = true
    let threatTypes: string[] = []
    let details = ''

    if (result.verdicts?.overall?.malicious) {
      scanVerdict = 'MALICIOUS'
      scanSafe = false
      threatTypes = ['MALICIOUS']
      details = 'Detected as malicious by URL Scanner'
    } else {
      const phishing = result.meta?.processors?.phishing
      if (phishing && phishing.detected) {
        scanVerdict = 'PHISHING'
        scanSafe = false
        threatTypes = ['PHISHING']
        details = 'Phishing detected by URL Scanner'
      } else {
        const radarRank = result.meta?.processors?.radarRank
        details = `No threats detected. Rank: ${radarRank ?? 'N/A'}`
      }
    }

    return {
      safe: scanSafe,
      threatTypes: threatTypes.length > 0 ? threatTypes : undefined,
      details,
      verdict: scanVerdict
    }
  } catch (error) {
    console.error('Cloudflare Radar scan error:', error)
    return {
      safe: false,
      details: 'Scan unavailable',
      threatTypes: ['UNKNOWN'],
      verdict: 'UNKNOWN'
    }
  }
}
