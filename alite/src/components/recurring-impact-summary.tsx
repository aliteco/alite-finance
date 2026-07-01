// filepath: alite/src/components/recurring-impact-summary.tsx
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'

interface RecurringImpactSummaryProps {
  monthlyIncome: number
  monthlyExpense: number
  currency: string
  mixedCurrencyNote?: boolean
}

function formatCurrency(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

export default function RecurringImpactSummary({
  monthlyIncome,
  monthlyExpense,
  currency,
  mixedCurrencyNote,
}: RecurringImpactSummaryProps) {
  const net = monthlyIncome - monthlyExpense

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-card border border-border rounded-2xl px-3 py-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Recurring in</p>
          <p className="text-sm font-bold tabular-nums text-income">
            +{formatCurrency(monthlyIncome, currency)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-3 py-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Recurring out</p>
          <p className="text-sm font-bold tabular-nums text-expense">
            −{formatCurrency(monthlyExpense, currency)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-3 py-3">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide mb-1">Net / month</p>
          <p className={`text-sm font-bold tabular-nums ${net >= 0 ? 'text-income' : 'text-expense'}`}>
            {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
          </p>
        </div>
      </div>
      {mixedCurrencyNote && (
        <p className="text-[10px] text-muted-foreground px-1">
          Only rules in {currency} are included above — rules in other currencies aren&apos;t converted yet.
        </p>
      )}
    </div>
  )
}