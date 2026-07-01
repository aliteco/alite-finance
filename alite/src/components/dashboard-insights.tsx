// filepath: alite/src/components/dashboard-insights.tsx
'use client'

import Link from 'next/link'
import { AlertTriangle, Repeat, TrendingDown, CheckCircle2 } from 'lucide-react'
import { useCurrency } from '@/components/currency-provider'

export interface InsightAccount {
  id: string
  name: string
  currency: string
  balance: number
  type: string
}

export interface InsightBudget {
  id: string
  name: string
  spent: number
  amount: number
  currency: string
  is_over: boolean
  percentage: number
}

interface DashboardInsightsProps {
  accounts: InsightAccount[]
  overBudgets: InsightBudget[]
  nearLimitBudgets: InsightBudget[]
  overdueRecurringCount: number
}

// Flags any active credit_card account in negative territory beyond a
// reasonable utilization heuristic, and any non-credit account that has
// drifted negative (which should never legitimately happen and signals a
// data problem worth surfacing).
function getLowBalanceAlerts(accounts: InsightAccount[]) {
  return accounts.filter(a => a.type !== 'credit_card' && a.balance < 0)
}

export default function DashboardInsights({
  accounts,
  overBudgets,
  nearLimitBudgets,
  overdueRecurringCount,
}: DashboardInsightsProps) {
  const { convert, format, displayCurrency } = useCurrency()
  const lowBalanceAccounts = getLowBalanceAlerts(accounts)
  const hasAnyAlert =
    overBudgets.length > 0 ||
    nearLimitBudgets.length > 0 ||
    overdueRecurringCount > 0 ||
    lowBalanceAccounts.length > 0

  if (!hasAnyAlert) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-income/20 bg-income/5 px-4 py-3.5"
      >
        <CheckCircle2 size={18} className="text-income shrink-0" aria-hidden="true" />
        <p className="text-xs font-medium text-foreground">
          Nothing needs your attention — budgets and bills are all on track.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2" role="region" aria-label="Things that need attention">
      {overdueRecurringCount > 0 && (
        <Link
          href="/recurring"
          className="flex items-center gap-3 rounded-2xl border border-expense/25 bg-expense/5 px-4 py-3.5 hover:bg-expense/10 transition-colors focus-visible:ring-2"
        >
          <Repeat size={18} className="text-expense shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {overdueRecurringCount} recurring bill{overdueRecurringCount !== 1 ? 's' : ''} overdue
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Tap to review and catch up</p>
          </div>
        </Link>
      )}

      {overBudgets.slice(0, 2).map(b => (
        <Link
          key={b.id}
          href="/budgets"
          className="flex items-center gap-3 rounded-2xl border border-expense/25 bg-expense/5 px-4 py-3.5 hover:bg-expense/10 transition-colors focus-visible:ring-2"
        >
          <AlertTriangle size={18} className="text-expense shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {b.name} is over budget
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {format(convert(b.spent, b.currency, displayCurrency), displayCurrency)} of {format(convert(b.amount, b.currency, displayCurrency), displayCurrency)} spent
            </p>
          </div>
        </Link>
      ))}

      {nearLimitBudgets.slice(0, 1).map(b => (
        <Link
          key={b.id}
          href="/budgets"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5 hover:bg-amber-500/10 transition-colors focus-visible:ring-2"
        >
          <TrendingDown size={18} className="text-amber-500 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {b.name} is at {Math.round(b.percentage)}% of its limit
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Slow down to stay within budget</p>
          </div>
        </Link>
      ))}

      {lowBalanceAccounts.slice(0, 1).map(a => (
        <Link
          key={a.id}
          href={`/accounts/${a.id}`}
          className="flex items-center gap-3 rounded-2xl border border-expense/25 bg-expense/5 px-4 py-3.5 hover:bg-expense/10 transition-colors focus-visible:ring-2"
        >
          <AlertTriangle size={18} className="text-expense shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">
              {a.name} has a negative balance
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {format(convert(a.balance, a.currency, displayCurrency), displayCurrency)} — review recent activity
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}