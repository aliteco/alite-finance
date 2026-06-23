// filepath: alite/src/components/recurring-impact-summary.tsx

interface RecurringImpactSummaryProps {
  monthlyIncome: number
  monthlyExpense: number
  currency: string
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`
  }
}

export default function RecurringImpactSummary({
  monthlyIncome,
  monthlyExpense,
  currency,
}: RecurringImpactSummaryProps) {
  const net = monthlyIncome - monthlyExpense

  return (
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
  )
}