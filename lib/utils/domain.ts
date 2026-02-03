/**
 * Extracts the root domain from a hostname.
 * Handles both standard TLDs (com, net) and multi-part TLDs (co.uk, com.au)
 *
 * Examples:
 * - web.whatsapp.com → whatsapp.com
 * - api.example.co.uk → example.co.uk
 * - sub.domain.com → domain.com
 * - localhost → localhost
 */
export function getRootDomain(hostname: string): string {
  // Handle localhost
  if (hostname === 'localhost') {
    return hostname
  }

  const parts = hostname.split('.')

  // Need at least 2 parts (domain.com)
  if (parts.length < 2) {
    return hostname
  }

  // Common multi-part TLDs that need 3+ parts
  // e.g., example.co.uk → we want example.co.uk, not just co.uk
  const multiPartTLDs = [
    'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'nhs.uk', 'police.uk', 'mod.uk',
    'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
    'co.nz', 'org.nz', 'net.nz', 'ac.nz', 'govt.nz',
    'co.jp', 'ne.jp', 'or.jp', 'ac.jp', 'go.jp',
    'co.in', 'net.in', 'org.in', 'ac.in', 'gov.in',
    'co.za', 'org.za', 'gov.za', 'ac.za',
    'com.my', 'net.my', 'org.my', 'edu.my', 'gov.my',
    'com.sg', 'net.sg', 'org.sg', 'edu.sg', 'gov.sg',
    'co.id', 'net.id', 'or.id', 'ac.id', 'go.id',
    'co.th', 'or.th', 'ac.th', 'go.th', 'net.th',
    'com.ph', 'net.ph', 'org.ph', 'edu.ph', 'gov.ph',
    'co.il', 'org.il', 'net.il', 'ac.il', 'gov.il',
    'com.br', 'net.br', 'org.br', 'edu.br', 'gov.br',
    'co.kr', 'ne.kr', 'or.kr', 'ac.kr', 'go.kr', 're.kr'
  ]

  // Check if the last 2 parts match a known multi-part TLD
  const lastTwoParts = parts.slice(-2).join('.')
  if (multiPartTLDs.includes(lastTwoParts) && parts.length >= 3) {
    // Return last 3 parts: domain + 2-part TLD
    return parts.slice(-3).join('.')
  }

  // For standard TLDs, return last 2 parts
  return parts.slice(-2).join('.')
}
