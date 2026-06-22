// filepath: alite/src/components/insights-view.tsx
'use client'

import { TrendingUp, TrendingDown, PiggyBank, Flame } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { CashflowPoint, CategorySpend, SavingsRateResult, BurnRateResult } from '@/lib/engines/analytics-engine'

interface InsightsViewProps {
  baseCurrency: string
  cashflow: CashflowPoint[]
  spending: CategorySpend[]
  savings: SavingsRateResult
  burn: BurnRateResult
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

export default function InsightsView({ baseCurrency, cashflow, spending, savings, burn }: InsightsViewProps) {
  const isRunwayInfinite = !Number.isFinite(burn.runwayMonths)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        <div className="border-b border-border/40 pb-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
            Insights
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
            Your money, analyzed
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Income (mo.)"
            value={`+${formatCurrency(savings.income, baseCurrency)}`}
            icon={<TrendingUp className="w-4 h-4 text-income" aria-hidden="true" />}
            accent="income"
          />
          <KpiCard
            label="Expenses (mo.)"
            value={`−${formatCurrency(savings.expense, baseCurrency)}`}
            icon={<TrendingDown className="w-4 h-4 text-expense" aria-hidden="true" />}
            accent="expense"
          />
          <KpiCard
            label="Savings rate"
            value={`${Math.round(savings.savingsRate)}%`}
            icon={<PiggyBank className="w-4 h-4 text-primary" aria-hidden="true" />}
            accent={savings.net >= 0 ? 'income' : 'expense'}
          />
          <KpiCard
            label="Runway"
            value={isRunwayInfinite ? '∞' : `${burn.runwayMonths.toFixed(1)} mo`}
            icon={<Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />}
            accent={isRunwayInfinite ? 'income' : burn.runwayMonths < 6 ? 'expense' : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Cashflow Trend</h2>
              <p className="text-[11px] text-muted-foreground">Last {cashflow.length} months</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0), baseCurrency), '']}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Spending by Category</h2>
              <p className="text-[11px] text-muted-foreground">This month</p>
            </div>
            {spending.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No expenses recorded this month.</p>
              </div>
            ) : (
              <div className="h-64 flex flex-col">
                <div className="flex-1 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={spending} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3}>
                        {spending.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(Number(value ?? 0), baseCurrency), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatCurrency(spending.reduce((s, c) => s + c.value, 0), baseCurrency)}
                    </span>
                  </div>
                </div>
                <ul className="flex flex-col gap-1 mt-2 max-h-[90px] overflow-y-auto pr-1">
                  {spending.slice(0, 6).map(item => (
                    <li key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                        <span className="font-semibold text-foreground truncate">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground font-mono">{Math.round(item.percentage)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-foreground">Burn Rate</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isRunwayInfinite
              ? 'Your average income covers your average expenses — reserves are not depleting at the current pace.'
              : `At your recent average spend of ${formatCurrency(burn.monthlyBurn, baseCurrency)}/mo net of income, your current reserves would last about ${burn.runwayMonths.toFixed(1)} months.`}
          </p>
        </section>

      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent?: 'income' | 'expense'
}) {
  const valueColor = accent === 'income' ? 'text-income' : accent === 'expense' ? 'text-expense' : 'text-foreground'
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between text-muted-foreground mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-lg font-bold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  )
}