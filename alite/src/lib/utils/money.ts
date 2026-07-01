// /lib/utils/money.ts
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'

export function formatMoney(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `

  const value = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${value}`
}