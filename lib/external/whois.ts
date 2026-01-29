export interface WhoisData {
  created: Date | null
  expires: Date | null
  registrar: string | null
  abuseContact: string | null
  domainAge: number | null
  error: string | null
}

interface WhoisJsResponse {
  success: boolean
  domain?: {name: string}
  registry?: {
    domain_id?: string
    expiry_date?: string
  }
  registrar?: {
    whois_server?: string
    url?: string
    iana_id?: string
    abuse_contact_email?: string
    abuse_contact_phone?: string
  }
  updated?: {date?: string}
  creation?: {date?: string}
}

/**
 * Fetch WHOIS data for a domain using whoisjs.com API
 * @param domain - The domain to check (e.g., "example.com")
 * @returns WhoisData with domain registration information
 */
export async function checkWhois(domain: string): Promise<WhoisData> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(`https://whoisjs.com/api/v1/${domain}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`whoisjs.com request failed for ${domain}: ${response.status}`)
      return {
        created: null,
        expires: null,
        registrar: null,
        abuseContact: null,
        domainAge: null,
        error: `whoisjs.com request failed: ${response.status}`,
      }
    }

    const data: WhoisJsResponse = await response.json()

    // Extract dates
    const created = data.creation?.date ? new Date(data.creation.date) : null
    const expires = data.registry?.expiry_date ? new Date(data.registry.expiry_date) : null

    // Extract registrar (use whois_server, fallback to URL hostname)
    let registrar: string | null = null
    if (data.registrar?.whois_server) {
      registrar = data.registrar.whois_server
    } else if (data.registrar?.url) {
      try {
        registrar = new URL(data.registrar.url).hostname
      } catch {
        registrar = null
      }
    }

    // Extract abuse contact
    const abuseContact = data.registrar?.abuse_contact_email || null

    // Calculate domain age in days
    let domainAge: number | null = null
    if (created) {
      const now = new Date()
      const diffTime = now.getTime() - created.getTime()
      domainAge = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }

    console.log(`[whoisjs.com][${domain}] Found registration data: Age=${domainAge} days, Registrar=${registrar}, Abuse=${abuseContact}`)

    return {
      created,
      expires,
      registrar,
      abuseContact,
      domainAge,
      error: null,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`whoisjs.com request timeout for ${domain}`)
      return {
        created: null,
        expires: null,
        registrar: null,
        abuseContact: null,
        domainAge: null,
        error: 'Request timeout',
      }
    }

    console.error(`whoisjs.com request error for ${domain}:`, error)
    return {
      created: null,
      expires: null,
      registrar: null,
      abuseContact: null,
      domainAge: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
