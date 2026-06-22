// filepath: alite/src/lib/services/currency-types.ts

export type CurrencyCode =
  | 'IDR' | 'USD' | 'EUR' | 'TWD' | 'JPY' | 'SGD' | 'GBP'
  | 'AUD' | 'CNY' | 'HKD' | 'KRW' | 'MYR' | 'THB' | 'PHP' | 'VND'

export const CURRENCY_SYMBOLS: Readonly<Record<string, string>> = {
  USD: '$',
  IDR: 'Rp',
  EUR: '€',
  JPY: '¥',
  SGD: 'S$',
  GBP: '£',
  AUD: 'A$',
  MYR: 'RM',
  TWD: 'NT$',
  CNY: '¥',
  HKD: 'HK$',
  KRW: '₩',
  THB: '฿',
  PHP: '₱',
  VND: '₫',
}

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = [
  'IDR', 'USD', 'EUR', 'TWD', 'JPY', 'SGD', 'GBP',
  'AUD', 'CNY', 'HKD', 'KRW', 'MYR', 'THB', 'PHP', 'VND',
]

export const STATIC_USD_FALLBACK_RATES: Readonly<Record<string, number>> = {
  USD: 1.0,
  IDR: 16350.0,
  EUR: 0.93,
  TWD: 32.4,
  JPY: 158.5,
  SGD: 1.35,
  GBP: 0.79,
  AUD: 1.50,
  CNY: 7.25,
  HKD: 7.8,
  KRW: 1385.0,
  MYR: 4.71,
  THB: 36.6,
  PHP: 58.7,
  VND: 25450.0,
}

export type RateSource = 'db' | 'db-inverse' | 'live' | 'static-fallback' | 'identity'

export interface ResolvedRate {
  rate: number
  source: RateSource
  asOfDate: string // ISO date the rate applies to
}

export interface RateLookupResult {
  rate: number
  error?: string
  source: RateSource
}