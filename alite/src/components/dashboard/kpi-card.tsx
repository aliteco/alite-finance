// filepath: alite/src/components/dashboard/kpi-card.tsx
'use client'

import { useCurrency } from '@/components/currency-provider'
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  amount: number
  fromCurrency: string
  icon: ReactNode
  sub?: string
  accent?: 'income' | 'expense' | 'neutral'
  trend?: { direction: 'up' | 'down'; label: string } | null
}

export default function KpiCard({ label, amount, fromCurrency, icon, sub, accent = 'neutral', trend }: KpiCardProps) {
  const { convert, format } = useCurrency()

  const converted = convert(amount, fromCurrency)
  const valueColor =
    accent === 'income' ? 'text-income' : accent === 'expense' ? 'text-expense' : 'text-foreground'

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-border-strong transition-colors min-w-0">
      <div className="flex items-center justify-between text-muted-foreground mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider truncate">{label}</span>
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      </div>
      <div>
        <p className={`text-lg md:text-2xl font-bold tracking-tight tabular-nums truncate ${valueColor}`}>
          {format(converted)}
        </p>
        <div className="flex items-center gap-1.5 mt-1 min-h-[14px]">
          {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
          {trend && (
            <span
              className={`text-[10px] font-semibold inline-flex items-center gap-0.5 shrink-0 ${
                trend.direction === 'up' ? 'text-income' : 'text-expense'
              }`}
            >
              {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}