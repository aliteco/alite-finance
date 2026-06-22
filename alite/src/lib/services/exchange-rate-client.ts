// filepath: alite/src/lib/services/exchange-rate-client.ts
'use client'

let cache: {
  rates: Record<string, number>
  fetchedAt: number
} | null = null

const LIVE_CACHE_TTL_MS = 10 * 60 * 1000

const API_URL = process.env.RATES_URL!
const API_KEY = process.env.RATES_SECRET!

export const ClientRateFacade = {
  async fetchUsdRates(): Promise<Record<string, number>> {
    const now = Date.now()

    if (cache && now - cache.fetchedAt < LIVE_CACHE_TTL_MS) {
      return cache.rates
    }

    try {
      const res = await fetch(`${API_URL}?key=${API_KEY}`)

      if (!res.ok) throw new Error('FX API failed')

      const data = await res.json()

      if (!data?.rates) throw new Error('Invalid FX response')

      cache = {
        rates: data.rates,
        fetchedAt: now,
      }

      return cache.rates
    } catch {
      // fallback (last resort)
      const fallback = {
        USD: 1,
      }

      cache = {
        rates: fallback,
        fetchedAt: now,
      }

      return fallback
    }
  },

  convertSync(
    amount: number,
    from: string,
    to: string,
    rates?: Record<string, number>
  ): number {
    if (from === to || amount === 0) return amount

    const table = rates ?? cache?.rates

    if (!table) return amount

    const fromUsd = from === 'USD' ? 1 : table[from]
    const toUsd = to === 'USD' ? 1 : table[to]

    if (!fromUsd || !toUsd) return amount

    return parseFloat(((amount * toUsd) / fromUsd).toFixed(2))
  },
}