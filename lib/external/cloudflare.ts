import { scanAndWait } from '@/lib/repo/cloudflare-scanner'

export async function checkCloudflareRadar(sanitized: string): Promise<{
  safe: boolean
  threatTypes?: string[]
  details?: string
  verdict?: string
  unlisted?: boolean
}> {
  try {
    const result = await scanAndWait(sanitized, 90)
    console.log(result);

    let scanVerdict = 'UNKNOWN'
    let scanSafe = false
    let threatTypes: string[] = []
    let details = ''
    let unlisted = false

    // Check visibility from Cloudflare response
    if (!result.task?.success && result.task?.visibility === 'unlisted') {
      return {
        safe: scanSafe,
        threatTypes: threatTypes,
        details: 'The domain is not publicly listed on internet',
        verdict: scanVerdict,
        unlisted: true
      }
    }

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
        scanVerdict = 'SAFE'
        scanSafe = true
      }
    }

    return {
      safe: scanSafe,
      threatTypes: threatTypes.length > 0 ? threatTypes : undefined,
      details,
      verdict: scanVerdict,
      unlisted
    }
  } catch (error) {
    console.error('Cloudflare Radar scan error:', error)
    return {
      safe: false,
      details: 'Scan unavailable',
      threatTypes: ['UNKNOWN'],
      verdict: 'UNKNOWN',
      unlisted: false
    }
  }
}
