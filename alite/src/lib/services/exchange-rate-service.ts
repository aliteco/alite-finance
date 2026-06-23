// filepath: alite/src/lib/services/exchange-rate-service.ts

import type {
  ResolvedRate,
  RateLookupResult,
} from './currency-types'

interface CacheEntry {
  rates: Record<string, number>
  fetchedAt: number
  source: 'live'
}

const LIVE_CACHE_TTL_MS = 10 * 60 * 1000 // 10 min

export class ExchangeRateService {
  private static liveCache: CacheEntry | null = null

  private static API_URL = process.env.NEXT_PUBLIC_RATES_URL!
  private static API_SECRET = process.env.NEXT_PUBLIC_RATES_SECRET!

  /**
   * Fetch live USD-based rates
   */
  private static async getLiveRates(): Promise<{
    rates: Record<string, number>
    source: 'live'
  }> {
    const now = Date.now()

    if (this.liveCache && now - this.liveCache.fetchedAt < LIVE_CACHE_TTL_MS) {
      return { rates: this.liveCache.rates, source: 'live' }
    }

    const res = await fetch(`${this.API_URL}?key=${this.API_SECRET}`)

    if (!res.ok) {
      throw new Error(`Rate API error: ${res.status}`)
    }

    const data = await res.json()

    if (!data?.rates) {
      throw new Error('Malformed FX API response')
    }

    this.liveCache = {
      rates: data.rates,
      fetchedAt: now,
      source: 'live',
    }

    return { rates: data.rates, source: 'live' }
  }

  /**
   * CORE RATE RESOLUTION (NO DATABASE)
   */
  static async getRate(
    from: string,
    to: string,
    dateStr?: string
  ): Promise<ResolvedRate> {
    if (from === to) {
      return {
        rate: 1,
        source: 'identity',
        asOfDate: dateStr ?? new Date().toISOString().slice(0, 10),
      }
    }

    const { rates, source } = await this.getLiveRates()

    const fromUsd = from === 'USD' ? 1 : rates[from]
    const toUsd = to === 'USD' ? 1 : rates[to]

    if (!fromUsd || !toUsd) {
      throw new Error(`Missing FX rate for ${from} or ${to}`)
    }

    const rate = toUsd / fromUsd

    return {
      rate,
      source,
      asOfDate: dateStr ?? new Date().toISOString().slice(0, 10),
    }
  }

  static async getRateForForm(
    from: string,
    to: string
  ): Promise<RateLookupResult> {
    const resolved = await this.getRate(from, to)

    return {
      rate: resolved.rate,
      source: resolved.source,
    }
  }

  static async convert(
    amount: number,
    from: string,
    to: string,
    dateStr?: string
  ): Promise<number> {
    if (from === to || amount === 0) return amount

    const { rate } = await this.getRate(from, to, dateStr)

    return parseFloat((amount * rate).toFixed(2))
  }

  static async convertBatch(
    items: { amount: number; currency: string }[],
    to: string,
    dateStr?: string
  ): Promise<number[]> {
    const distinct = Array.from(new Set(items.map(i => i.currency)))
    const map = new Map<string, number>()

    for (const cur of distinct) {
      const { rate } = await this.getRate(cur, to, dateStr)
      map.set(cur, rate)
    }

    return items.map(i =>
      parseFloat((i.amount * (map.get(i.currency) ?? 1)).toFixed(2))
    )
  }

  static clearCache(): void {
    this.liveCache = null
  }
}