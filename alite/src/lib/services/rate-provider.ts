// filepath: alite/src/lib/services/rate-providers.ts

import { STATIC_USD_FALLBACK_RATES } from './currency-types'

export interface RateProvider {
  readonly name: string
  fetchUsdRates(): Promise<Record<string, number>>
}

/**
 * Google Apps Script Rates Provider
 */
export class OpenErApiProvider implements RateProvider {
  readonly name = 'google-apps-script-rates'

  async fetchUsdRates(): Promise<Record<string, number>> {
    const url = process.env.RATES_URL
    const secret = process.env.RATES_SECRET

    if (!url || !secret) {
      throw new Error('Missing RATES_URL or RATES_SECRET')
    }

    const response = await fetch(`${url}?key=${secret}`, {
      next: { revalidate: 600 },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenErApiProvider: HTTP ${response.status} ${text}`)
    }

    const data = await response.json()

    if (!data?.success || !data?.rates) {
      throw new Error('OpenErApiProvider: malformed response')
    }

    return data.rates as Record<string, number>
  }
}

/**
 * Deterministic fallback provider
 */
export class StaticFallbackProvider implements RateProvider {
  readonly name = 'static-fallback'

  async fetchUsdRates(): Promise<Record<string, number>> {
    return { ...STATIC_USD_FALLBACK_RATES }
  }
}