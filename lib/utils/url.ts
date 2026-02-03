/**
 * Validates if a string is a valid URL format
 */
export function isValidUrl(urlString: string): boolean {
  return getUrlError(urlString) === null
}

/**
 * Returns an error message if the URL is invalid, null if valid
 */
export function getUrlError(urlString: string): string | null {
  if (!urlString || urlString.trim().length === 0) {
    return 'Please enter a URL'
  }

  const trimmed = urlString.trim()

  // Auto-prepend https:// if missing protocol
  const normalizedUrl = trimmed.includes('://') ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(normalizedUrl)

    // Check if hostname exists
    if (!url.hostname || url.hostname.length === 0) {
      return 'Invalid URL: hostname is required'
    }

    // Check for valid hostname (basic validation)
    // Must contain at least one dot for domains, or be a valid IP
    const hostname = url.hostname

    // Allow localhost for testing
    if (hostname === 'localhost') {
      return null
    }

    // Check if it looks like a domain (has at least one dot)
    // or a valid IP address
    const hasDot = hostname.includes('.')
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)

    if (!hasDot && !isIpAddress) {
      return 'Invalid URL: please enter a valid website address (e.g., example.com)'
    }

    // Check TLD is at least 2 characters for domains
    if (hasDot && !isIpAddress) {
      const tld = hostname.split('.').pop()
      if (tld && tld.length < 2) {
        return 'Invalid URL: top-level domain must be at least 2 characters'
      }
    }

    return null
  } catch {
    return 'Invalid URL format'
  }
}

/**
 * Normalizes a URL by ensuring it has a protocol
 */
export function normalizeUrl(urlString: string): string {
  const trimmed = urlString.trim()
  return trimmed.includes('://') ? trimmed : `https://${trimmed}`
}
