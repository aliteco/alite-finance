// filepath: alite/src/components/account-balance-chip.tsx

interface AccountBalanceChipProps {
  balance: number
  currency: string
  isCreditCard?: boolean
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`
  }
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