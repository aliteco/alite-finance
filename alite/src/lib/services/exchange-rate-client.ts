'use client'

import { STATIC_USD_FALLBACK_RATES } from './currency-types'

let cache: {
  rates: Record<string, number>
  fetchedAt: number
} | null = null

const LIVE_CACHE_TTL_MS = 10 * 60 * 1000

const API_URL = process.env.NEXT_PUBLIC_RATES_URL!
const API_KEY = process.env.NEXT_PUBLIC_RATES_KEY!

export const ClientRateFacade = {
  async fetchUsdRates(): Promise<Record<string, number>> {
    const now = Date.now()

    if (cache && now - cache.fetchedAt < LIVE_CACHE_TTL_MS) {
      return cache.rates
    }

    try {
      if (!API_URL || !API_KEY) throw new Error('Missing FX API Credentials')

      const res = await fetch(`${API_URL}?key=${API_KEY}`)
      if (!res.ok) throw new Error('FX API failed')

      const data = await res.json()
      if (!data?.rates) throw new Error('Invalid FX response')

      cache = {
        rates: data.rates,
        fetchedAt: now,
      }
      return cache.rates
    } catch (error) {
      console.error('FX Fetch failed, using static fallbacks:', error)
      const fallback = { ...STATIC_USD_FALLBACK_RATES }
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

    const table = rates ?? cache?.rates ?? STATIC_USD_FALLBACK_RATES

    const fromUsd = from === 'USD' ? 1 : table[from]
    const toUsd = to === 'USD' ? 1 : table[to]

    if (!fromUsd || !toUsd) {
      console.warn(`No rate found for ${from} to ${to}`)
      return from === to ? amount : 0 
    }

    const converted = (amount * toUsd) / fromUsd
    return parseFloat(converted.toFixed(2))
  },
}