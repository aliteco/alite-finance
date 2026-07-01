// filepath: alite/src/lib/hooks/use-converted-amount.ts
'use client'

import { useMemo } from 'react'
import { useCurrency } from '@/components/currency-provider'

export function useConvertedAmount(amount: number, fromCurrency: string) {
  const { convert, format, displayCurrency } = useCurrency()

  const converted = useMemo(
    () => convert(amount, fromCurrency, displayCurrency),
    [amount, fromCurrency, displayCurrency, convert]
  )

  const formatted = useMemo(
    () => format(converted, displayCurrency),
    [converted, displayCurrency, format]
  )

  return { converted, formatted, displayCurrency }
}

export function useConvertedTotal(items: { amount: number; currency: string }[]) {
  const { convert, format, displayCurrency } = useCurrency()

  const total = useMemo(
    () => items.reduce((sum, item) => sum + convert(item.amount, item.currency, displayCurrency), 0),
    [items, displayCurrency, convert]
  )

  const formatted = useMemo(() => format(total, displayCurrency), [total, displayCurrency, format])

  return { total, formatted, displayCurrency }
}