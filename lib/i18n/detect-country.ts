import { headers } from 'next/headers'
import type { Locale } from './translations'

/**
 * Detect user's country from request headers
 * Returns 'id' for Indonesia, 'en' for others
 */
export async function detectLocale(): Promise<Locale> {
  try {
    const headersList = await headers()

    // Try Cloudflare country header first (most reliable if using Cloudflare)
    const cfCountry = headersList.get('cf-ipcountry')
    if (cfCountry) {
      return cfCountry.toUpperCase() === 'ID' ? 'id' : 'en'
    }

    // Try Vercel header
    const vercelCountry = headersList.get('x-vercel-ip-country')
    if (vercelCountry) {
      return vercelCountry.toUpperCase() === 'ID' ? 'id' : 'en'
    }

    // Try other common headers
    const country = headersList.get('x-country') || headersList.get('cf-country')
    if (country) {
      return country.toUpperCase() === 'ID' ? 'id' : 'en'
    }

    // Fallback: Check Accept-Language header for Indonesian
    const acceptLanguage = headersList.get('accept-language') || ''
    if (acceptLanguage.toLowerCase().includes('id')) {
      return 'id'
    }
  } catch (error) {
    console.error('Error detecting locale:', error)
  }

  // Default to English
  return 'en'
}
