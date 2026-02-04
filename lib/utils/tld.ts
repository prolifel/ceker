import { getTLD } from '@/lib/repo/tld'

export interface TLDValidationResult {
  valid: boolean
  reason?: string
  tld?: string
}

/**
 * Validate TLD
 * 1. Extract TLD from hostname (handles two-part TLDs like .co.id, .go.id)
 * 2. Check if TLD contains only letters
 * 3. Check if base TLD exists in database
 *
 * For two-part TLDs (e.g., .co.id), we validate that the base TLD (.id) exists in database.
 */
export async function validateTLD(hostname: string): Promise<TLDValidationResult> {
  console.log(`validateTLD: ${hostname}`)

  const parts = hostname.split('.')
  if (parts.length < 2) {
    return {
      valid: false,
      reason: 'Could not extract TLD from hostname'
    }
  }

  const baseTLD = `.${parts[parts.length - 1]}`

  // Check if base TLD exists in database first
  const baseTLDExists = await getTLD(baseTLD)
  if (!baseTLDExists) {
    return {
      valid: false,
      reason: `TLD '${baseTLD}' is not recognized`,
      tld: baseTLD
    }
  }

  // Try two-part TLD (e.g., .co.id, .go.id, .ac.id)
  // Common second-level domains that form effective two-part TLDs
  const commonSecondLevels = [
    // Indonesian second-level domains
    'ac', 'biz', 'co', 'desa', 'go', 'my', 'net', 'or', 'sch', 'web',
    // Common ccTLD second-levels
    'com', 'org', 'gov', 'edu', 'mil',
    // UK-like ccTLD second-levels
    'ac', 'co', 'gov', 'ltd', 'me', 'net', 'nhs', 'org', 'plc', 'police', 'sch'
  ]

  let tld: string = baseTLD
  if (parts.length >= 3) {
    const secondLevel = parts[parts.length - 2].toLowerCase()
    if (commonSecondLevels.includes(secondLevel)) {
      tld = `.${secondLevel}${baseTLD}`
    }
  }

  // Check for special characters - only letters allowed (remove all dots for validation)
  const tldWithoutDot = tld.replace(/\./g, '')
  console.log(`tldWithoutDot: ${tldWithoutDot}`)

  if (!/^[a-z]+$/.test(tldWithoutDot)) {
    return {
      valid: false,
      reason: 'TLD contains invalid characters (only letters allowed)',
      tld
    }
  }

  return {
    valid: true,
    tld
  }
}
