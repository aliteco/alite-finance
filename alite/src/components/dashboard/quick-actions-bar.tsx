// filepath: alite/src/components/dashboard/quick-actions-bar.tsx

import Link from 'next/link'
import { Plus, TrendingDown, TrendingUp, Shuffle, Target } from 'lucide-react'

const ACTIONS = [
  { href: '/transactions/new?type=expense', label: 'Expense', icon: TrendingDown, color: 'text-expense' },
  { href: '/transactions/new?type=income', label: 'Income', icon: TrendingUp, color: 'text-income' },
  { href: '/transactions/new?type=transfer', label: 'Transfer', icon: Shuffle, color: 'text-[#818cf8]' },
  { href: '/goals/new', label: 'Goal', icon: Target, color: 'text-primary' },
]

export default function QuickActionsBar() {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Quick actions">
      {ACTIONS.map(({ href, label, icon: Icon, color }) => (
        <Link
          key={href}
          href={href}
          className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Icon size={14} className={color} aria-hidden="true" />
          {label}
        </Link>
      ))}
      <Link
        href="/transactions/new"
        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 ml-auto"
      >
        <Plus size={14} aria-hidden="true" />
        Add
      </Link>
    </div>
  )
}