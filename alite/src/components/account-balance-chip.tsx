// filepath: alite/src/components/account-balance-chip.tsx
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'

interface AccountBalanceChipProps {
  balance: number
  currency: string
  isCreditCard?: boolean
}

function formatCurrency(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

export default function AccountBalanceChip({ balance, currency, isCreditCard }: AccountBalanceChipProps) {
  const isNegative = balance < 0
  const showAsWarning = isNegative && !isCreditCard

  return (
    <span
      className={`text-sm font-bold tabular-nums ${showAsWarning ? 'text-expense' : 'text-foreground'}`}
      aria-label={`Balance: ${formatCurrency(balance, currency)}${showAsWarning ? ' (negative)' : ''}`}
    >
      {formatCurrency(balance, currency)}
    </span>
  )
}