// filepath: alite/src/components/insights-view.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, PiggyBank, Flame, Sparkles, Smile, BadgeInfo } from 'lucide-react'
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

const DEFAULT_SAVINGS_TARGET = 20

export default function InsightsView({ baseCurrency, cashflow, spending, savings, burn }: InsightsViewProps) {
  const [mounted, setMounted] = useState(false)
  const [privacyEnabled, setPrivacyEnabled] = useState(false)
  const [savingsTarget, setSavingsTarget] = useState(DEFAULT_SAVINGS_TARGET)
  const [lifestyleDiscount, setLifestyleDiscount] = useState(0)

  useEffect(() => {
    setMounted(true)

    const checkPrivacy = () => {
      setPrivacyEnabled(localStorage.getItem('alite_privacy_mode') === 'true')
    }
    const checkSavingsTarget = () => {
      const stored = localStorage.getItem('alite_savings_target')
      if (stored) setSavingsTarget(parseInt(stored, 10))
    }

    checkPrivacy()
    checkSavingsTarget()

    window.addEventListener('alite_privacy_changed', checkPrivacy)
    window.addEventListener('alite_savings_target_changed', checkSavingsTarget)
    return () => {
      window.removeEventListener('alite_privacy_changed', checkPrivacy)
      window.removeEventListener('alite_savings_target_changed', checkSavingsTarget)
    }
  }, [])

  const wrapPrivacy = (val: string) => (mounted && privacyEnabled ? '••••••' : val)

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

  const isRunwayInfinite = !Number.isFinite(burn.runwayMonths)

  const allocationBreakdown = useMemo(() => {
    let needsSum = 0
    let wantsSum = 0

    spending.forEach(item => {
      const name = item.name.toLowerCase()
      if (
        name.includes('rent') || name.includes('utilit') || name.includes('bill') ||
        name.includes('tax') || name.includes('grocer') || name.includes('gas') ||
        name.includes('health') || name.includes('medi') || name.includes('insur') ||
        name.includes('transport') || name.includes('commut')
      ) {
        needsSum += item.value
      } else {
        wantsSum += item.value
      }
    })

    const totalExp = needsSum + wantsSum
    const netIncomeDef = savings.income || (totalExp + savings.net)
    const netSavings = Math.max(0, netIncomeDef - totalExp)

    const needsPct = netIncomeDef > 0 ? (needsSum / netIncomeDef) * 100 : 0
    const wantsPct = netIncomeDef > 0 ? (wantsSum / netIncomeDef) * 100 : 0
    const savingsPct = netIncomeDef > 0 ? (netSavings / netIncomeDef) * 100 : 0

    return { needs: needsSum, needsPct, wants: wantsSum, wantsPct, savings: netSavings, savingsPct, totalIncome: netIncomeDef, totalExp }
  }, [spending, savings])

  const healthScore = useMemo(() => {
    let score = 50
    const currentRate = savings.savingsRate
    if (currentRate >= savingsTarget) score += 25
    else if (currentRate > 0) score += (currentRate / savingsTarget) * 25
    else score -= 30

    if (isRunwayInfinite) score += 25
    else if (burn.runwayMonths >= 12) score += 25
    else if (burn.runwayMonths >= 6) score += 15
    else if (burn.runwayMonths >= 3) score += 5
    else score -= 15

    if (allocationBreakdown.wantsPct <= 30) score += 25
    else if (allocationBreakdown.wantsPct <= 45) score += 15
    else score -= 10

    return Math.min(100, Math.max(10, Math.round(score)))
  }, [savings, burn, savingsTarget, isRunwayInfinite, allocationBreakdown])

  const simulatedExpenses = useMemo(() => {
    const wantsReduced = allocationBreakdown.wants * (1 - lifestyleDiscount / 100)
    return allocationBreakdown.needs + wantsReduced
  }, [allocationBreakdown, lifestyleDiscount])

  const simulatedRunway = useMemo(() => {
    if (savings.income >= simulatedExpenses) return Infinity
    const monthlyNetBurn = simulatedExpenses - savings.income
    const currentReserves = burn.monthlyBurn * burn.runwayMonths
    if (monthlyNetBurn <= 0) return Infinity
    return currentReserves / monthlyNetBurn
  }, [savings.income, simulatedExpenses, burn])

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Insights
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              Financial Intelligence
            </h1>
          </div>
          <div className="flex gap-2">
            <span className="text-[11px] bg-muted px-3 py-1.5 rounded-xl border border-border/70 font-semibold flex items-center gap-1 text-muted-foreground">
              <Sparkles size={11} className="text-primary" aria-hidden="true" />
              Intelligence Engine Active
            </span>
          </div>
        </div>

        <section className="bg-card border border-border rounded-3xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 flex flex-col items-center justify-center space-y-2 border-b md:border-b-0 md:border-r border-border pb-5 md:pb-0 md:pr-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
              Wealth Health Score
            </span>
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" aria-hidden="true">
                <circle cx="56" cy="56" r="48" stroke="var(--muted)" strokeWidth="6" fill="transparent" />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={mounted ? 2 * Math.PI * 48 * (1 - healthScore / 100) : 2 * Math.PI * 48}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-black text-foreground tracking-tight">{mounted ? healthScore : '—'}</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Index</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full
              ${healthScore >= 80
                ? 'bg-emerald-500/10 text-emerald-500'
                : healthScore >= 55
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-red-500/10 text-red-500'}`}>
              {healthScore >= 80 ? 'Excellent' : healthScore >= 55 ? 'Good' : 'Needs Optimization'}
            </span>
          </div>

          <div className="md:col-span-8 space-y-3.5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 leading-none">
              <Smile size={16} className="text-primary" aria-hidden="true" /> Advice Diagnostic
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {healthScore >= 80
                ? `Exceptional structure. Your savings rate of ${Math.round(savings.savingsRate)}% comfortably clears your ${savingsTarget}% target.`
                : healthScore >= 55
                ? `Decent buffer. Savings sit at ${Math.round(savings.savingsRate)}%. Trimming non-essential spend could help reach ${savingsTarget}%.`
                : `Active attention recommended. Your savings rate has dropped below a sustainable level — review recurring costs and discretionary spend.`}
            </p>
            <div className="grid grid-cols-2 gap-3 text-[11px] font-medium text-foreground pt-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${savings.savingsRate >= savingsTarget ? 'bg-emerald-500' : 'bg-amber-500'}`} aria-hidden="true" />
                <span>Savings target: <strong className="font-mono">{savingsTarget}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isRunwayInfinite || burn.runwayMonths >= 6 ? 'bg-emerald-500' : 'bg-red-500'}`} aria-hidden="true" />
                <span>Runway cushion: <strong className="font-mono">{isRunwayInfinite ? 'Infinite' : 'Healthy'}</strong></span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Income (mo.)"
            value={`+${wrapPrivacy(formatCurrency(savings.income, baseCurrency))}`}
            icon={<TrendingUp className="w-4 h-4 text-income" aria-hidden="true" />}
            accent="income"
          />
          <KpiCard
            label="Expenses (mo.)"
            value={`−${wrapPrivacy(formatCurrency(savings.expense, baseCurrency))}`}
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
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                      formatter={(value) => [wrapPrivacy(formatCurrency(Number(value ?? 0), baseCurrency)), '']}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" aria-hidden="true" />
              )}
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
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spending} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3}>
                          {spending.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [wrapPrivacy(formatCurrency(Number(value ?? 0), baseCurrency)), '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {wrapPrivacy(formatCurrency(spending.reduce((s, c) => s + c.value, 0), baseCurrency))}
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

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <BadgeInfo size={15} className="text-indigo-400" aria-hidden="true" />
              The 50/30/20 Budgeting Diagnostic
            </h2>
            <p className="text-xs text-muted-foreground">
              How much of your income funds Needs (survival), Wants (lifestyle), and Savings (net reserve).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <BudgetBar
              label="Needs (Rent, Bills, Gas)"
              target="50%"
              actual={`${Math.round(allocationBreakdown.needsPct)}%`}
              amount={wrapPrivacy(formatCurrency(allocationBreakdown.needs, baseCurrency))}
              color="bg-amber-500"
              percentage={allocationBreakdown.needsPct}
            />
            <BudgetBar
              label="Wants (Dining out, Luxury)"
              target="30%"
              actual={`${Math.round(allocationBreakdown.wantsPct)}%`}
              amount={wrapPrivacy(formatCurrency(allocationBreakdown.wants, baseCurrency))}
              color="bg-rose-500"
              percentage={allocationBreakdown.wantsPct}
            />
            <BudgetBar
              label="Savings & Excess Surplus"
              target="20%"
              actual={`${Math.round(allocationBreakdown.savingsPct)}%`}
              amount={wrapPrivacy(formatCurrency(allocationBreakdown.savings, baseCurrency))}
              color="bg-emerald-500"
              percentage={allocationBreakdown.savingsPct}
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Flame size={15} className="text-orange-400" aria-hidden="true" />
                Live Runway & Burn Rate Simulator
              </h2>
              <p className="text-xs text-muted-foreground">
                Simulate cutting lifestyle spend and see the effect on your runway.
              </p>
            </div>
            <div className="text-xs bg-orange-500/10 text-orange-500 font-bold px-2 py-1 rounded-lg">
              Wants discount: {lifestyleDiscount}%
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="lifestyle-discount-slider" className="sr-only">Lifestyle spend discount percentage</label>
            <input
              id="lifestyle-discount-slider"
              type="range"
              min="0"
              max="60"
              step="5"
              value={lifestyleDiscount}
              onChange={(e) => setLifestyleDiscount(parseInt(e.target.value, 10))}
              className="w-full accent-orange-500 cursor-pointer h-1.5"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-muted/15 p-3.5 rounded-xl border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Simulated Monthly Burn</div>
                <div className="text-lg font-extrabold text-foreground font-mono mt-0.5">
                  {wrapPrivacy(formatCurrency(simulatedExpenses, baseCurrency))}
                </div>
              </div>
              <div className="bg-muted/15 p-3.5 rounded-xl border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Simulated Runway Duration</div>
                <div className="text-lg font-extrabold text-orange-500 font-mono mt-0.5">
                  {!Number.isFinite(simulatedRunway) ? 'Infinite (Income covers spend)' : `${simulatedRunway.toFixed(1)} Months`}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {isRunwayInfinite
                ? 'Your average income covers your average expenses — reserves are protected.'
                : `Cutting wants spend by ${lifestyleDiscount}% reduces estimated monthly expenses from ${formatCurrency(allocationBreakdown.totalExp, baseCurrency)} to ${formatCurrency(simulatedExpenses, baseCurrency)}, giving roughly ${!Number.isFinite(simulatedRunway) ? 'unbounded' : simulatedRunway.toFixed(1)} months of buffer.`}
            </p>
          </div>
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
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between text-muted-foreground mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-lg font-bold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  )
}

function BudgetBar({
  label,
  target,
  actual,
  amount,
  color,
  percentage,
}: {
  label: string
  target: string
  actual: string
  amount: string
  color: string
  percentage: number
}) {
  return (
    <div className="space-y-1.5 bg-muted/15 border border-border/40 p-3 rounded-xl flex flex-col justify-between">
      <div>
        <p className="text-[11px] font-bold text-foreground line-clamp-1">{label}</p>
        <p className="text-[10px] text-muted-foreground">Standard target: <strong className="font-mono text-foreground/80">{target}</strong></p>
      </div>
      <div className="space-y-1 pt-1">
        <div className="flex justify-between items-baseline text-xs font-mono">
          <span className="font-black text-foreground">{amount}</span>
          <span className="font-semibold text-muted-foreground">({actual})</span>
        </div>
        <div
          className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(Math.min(100, Math.max(0, percentage)))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label} allocation`}
        >
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>
    </div>
  )
}