// filepath: alite/src/lib/services/exchange-rate-service.ts

import { createClient as createServerClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  type ResolvedRate,
  type RateLookupResult,
} from './currency-types'

interface CacheEntry {
  rates: Record<string, number>
  fetchedAt: number
  source: 'live'
}

const LIVE_CACHE_TTL_MS = 10 * 60 * 1000 // 10 min

/**
 * ExchangeRateService
 * Single responsibility: resolve FX rate using:
 * 1. DB historical override (if exists)
 * 2. Live USD-based API (canonical source)
 */
export class ExchangeRateService {
  private static liveCache: CacheEntry | null = null

  private static API_URL = process.env.RATES_URL!
  private static API_SECRET = process.env.RATES_SECRET!

  /**
   * Fetch live USD-based rates from Apps Script API
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
   * CORE RATE RESOLUTION
   * Priority:
   * 1. DB override (historical accuracy)
   * 2. Live FX API (USD-based)
   */
  static async getRate(
    from: string,
    to: string,
    dateStr?: string,
    client?: SupabaseClient
  ): Promise<ResolvedRate> {
    if (from === to) {
      return {
        rate: 1,
        source: 'identity',
        asOfDate: dateStr ?? new Date().toISOString().slice(0, 10),
      }
    }

    const dateQuery =
      dateStr ??
      new Date().toISOString().slice(0, 10)

    const supabase = client ?? (await createServerClient())

    /**
     * 1. DB override (exact match or latest prior)
     */
    const { data: direct } = await supabase
      .from('exchange_rates')
      .select('rate, date')
      .eq('base_currency', from)
      .eq('target_currency', to)
      .lte('date', dateQuery)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (direct?.rate) {
      return {
        rate: direct.rate,
        source: 'db',
        asOfDate: direct.date,
      }
    }

    /**
     * 2. LIVE USD-based conversion
     * Formula:
     * rate(from→to) = USD_to / USD_from
     */
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
      asOfDate: dateQuery,
    }
  }

  /**
   * Form-friendly wrapper (kept for compatibility)
   */
  static async getRateForForm(
    from: string,
    to: string,
    client?: SupabaseClient
  ): Promise<RateLookupResult> {
    const resolved = await this.getRate(from, to, undefined, client)

    if (resolved.source === 'live' && from !== to) {
      return {
        rate: resolved.rate,
        source: resolved.source,
      }
    }

    return {
      rate: resolved.rate,
      source: resolved.source,
    }
  }

  /**
   * Convert amount
   */
  static async convert(
    amount: number,
    from: string,
    to: string,
    dateStr?: string,
    client?: SupabaseClient
  ): Promise<number> {
    if (from === to || amount === 0) return amount

    const { rate } = await this.getRate(from, to, dateStr, client)

    return parseFloat((amount * rate).toFixed(2))
  }

  /**
   * Batch conversion (optimized)
   */
  static async convertBatch(
    items: { amount: number; currency: string }[],
    to: string,
    dateStr?: string,
    client?: SupabaseClient
  ): Promise<number[]> {
    const distinct = Array.from(new Set(items.map(i => i.currency)))
    const map = new Map<string, number>()

    for (const cur of distinct) {
      const { rate } = await this.getRate(cur, to, dateStr, client)
      map.set(cur, rate)
    }

    return items.map(i =>
      parseFloat((i.amount * (map.get(i.currency) ?? 1)).toFixed(2))
    )
  }

  /**
   * Clear cache (testing / manual refresh)
   */
  static clearCache(): void {
    this.liveCache = null
  }
}