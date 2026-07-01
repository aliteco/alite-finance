// filepath: alite/src/components/currency-display.tsx
'use client'

import { useCurrency } from '@/components/currency-provider'
import { usePrivacyMode } from '@/lib/hooks/use-privacy-mode'

export default function CurrencyDisplay({
  amount,
  fromCurrency,
  className,
  signed = false,
}: {
  amount: number
  fromCurrency: string
  className?: string
  signed?: boolean
}) {
  const { convert, format } = useCurrency()
  const privacyMode = usePrivacyMode()

  const converted = convert(amount, fromCurrency)
  const sign = signed ? (converted >= 0 ? '+' : '') : ''

  if (privacyMode) {
    return <span className={className}>******</span>
  }

  return (
    <span className={className}>
      {sign}
      {format(converted)}
    </span>
  )
}

export function useCurrencyFormatter() {
  const { convert, format, displayCurrency } = useCurrency()

  function formatAmount(amount: number, fromCurrency: string) {
    return format(convert(amount, fromCurrency))
  }

  return { formatAmount, displayCurrency }
}