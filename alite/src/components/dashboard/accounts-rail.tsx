// filepath: alite/src/components/dashboard/accounts-rail.tsx

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface AccountRailItem {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  color?: string
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

export default function AccountsRail({ accounts }: { accounts: AccountRailItem[] }) {
  if (accounts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 text-center">
        <p className="text-xs text-muted-foreground mb-2">No accounts yet.</p>
        <Link href="/accounts/new" className="text-xs text-primary font-semibold hover:underline focus-visible:ring-2 rounded">
          + Add your first account
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accounts</h3>
        <Link href="/accounts" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 focus-visible:ring-2 rounded">
          Manage <ChevronRight size={12} aria-hidden="true" />
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory md:grid md:grid-cols-1 md:overflow-visible md:gap-2.5">
        {accounts.map(account => (
          <Link
            key={account.id}
            href={`/accounts/${account.id}`}
            className="snap-start shrink-0 w-40 md:w-full flex md:items-center md:justify-between flex-col md:flex-row gap-1.5 md:gap-0 bg-muted/20 border border-border/40 rounded-xl px-3.5 py-3 hover:bg-muted/40 transition-colors focus-visible:ring-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: account.color ? `${account.color}22` : 'var(--muted)', color: account.color ?? 'var(--muted-foreground)' }}
                aria-hidden="true"
              >
                {account.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-foreground truncate">{account.name}</span>
            </div>
            <span className={`text-xs font-bold tabular-nums shrink-0 ${account.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
              {formatCurrency(account.balance, account.currency)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}