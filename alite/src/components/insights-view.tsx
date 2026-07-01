// filepath: alite/src/components/insights-view.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp, TrendingDown, PiggyBank, Flame, Sparkles, AlertTriangle,
  Target, ArrowRight, ArrowDownRight, ArrowUpRight, Wallet, Zap,
  Lightbulb, ShieldCheck, ChevronRight, BarChart3, PieChart as PieIcon,
  Clock, TrendingUpIcon
} from 'lucide-react'
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
  LineChart,
  Line,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts'
import Link from 'next/link'
import Slider from '@/components/ui/slider'
import type { CashflowPoint, CategorySpend, SavingsRateResult, BurnRateResult } from '@/lib/engines/analytics-engine'
import { useCurrency } from '@/components/currency-provider'
import { usePrivacyMode } from '@/lib/hooks/use-privacy-mode'

interface InsightsViewProps {
  baseCurrency: string
  cashflow: CashflowPoint[]
  spending: CategorySpend[]
  savings: SavingsRateResult
  burn: BurnRateResult
}

const DEFAULT_SAVINGS_TARGET = 20

export default function InsightsView({ baseCurrency, cashflow, spending, savings, burn }: InsightsViewProps) {
  const { convert, format, displayCurrency } = useCurrency()
  const privacyMode = usePrivacyMode()
  const [mounted, setMounted] = useState(false)
  const [savingsTarget, setSavingsTarget] = useState(DEFAULT_SAVINGS_TARGET)
  const [lifestyleDiscount, setLifestyleDiscount] = useState(0)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('alite_savings_target')
    if (stored) setSavingsTarget(parseInt(stored, 10))
  }, [])

  const dCashflow = useMemo(
    () => cashflow.map(c => ({
      ...c,
      income: convert(c.income, baseCurrency, displayCurrency),
      expense: convert(c.expense, baseCurrency, displayCurrency),
      savings: convert(c.savings, baseCurrency, displayCurrency),
    })),
    [cashflow, baseCurrency, displayCurrency, convert]
  )

  const dSpending = useMemo(
    () => spending.map(s => ({ ...s, value: convert(s.value, baseCurrency, displayCurrency) })),
    [spending, baseCurrency, displayCurrency, convert]
  )

  const dSavings = useMemo(
    () => ({
      income: convert(savings.income, baseCurrency, displayCurrency),
      expense: convert(savings.expense, baseCurrency, displayCurrency),
      net: convert(savings.net, baseCurrency, displayCurrency),
      savingsRate: savings.savingsRate,
    }),
    [savings, baseCurrency, displayCurrency, convert]
  )

  const dBurn = useMemo(
    () => ({
      netWorth: convert(burn.netWorth, baseCurrency, displayCurrency),
      monthlyBurn: convert(burn.monthlyBurn, baseCurrency, displayCurrency),
      runwayMonths: burn.runwayMonths,
    }),
    [burn, baseCurrency, displayCurrency, convert]
  )

  const isRunwayInfinite = !Number.isFinite(dBurn.runwayMonths)

  const allocationBreakdown = useMemo(() => {
    let needsSum = 0
    let wantsSum = 0

    dSpending.forEach(item => {
      const name = item.name.toLowerCase()
      if (
        name.includes('rent') || name.includes('mortgage') || name.includes('utilit') ||
        name.includes('bill') || name.includes('tax') || name.includes('grocer') ||
        name.includes('gas') || name.includes('health') || name.includes('medi') ||
        name.includes('insur') || name.includes('transport') || name.includes('commut') ||
        name.includes('phone') || name.includes('internet') || name.includes('education') ||
        name.includes('loan') || name.includes('debt')
      ) {
        needsSum += item.value
      } else {
        wantsSum += item.value
      }
    })

    const totalExp = needsSum + wantsSum
    const netIncomeDef = dSavings.income || (totalExp + dSavings.net)
    const netSavings = Math.max(0, netIncomeDef - totalExp)

    const needsPct = netIncomeDef > 0 ? (needsSum / netIncomeDef) * 100 : 0
    const wantsPct = netIncomeDef > 0 ? (wantsSum / netIncomeDef) * 100 : 0
    const savingsPct = netIncomeDef > 0 ? (netSavings / netIncomeDef) * 100 : 0

    return { needs: needsSum, needsPct, wants: wantsSum, wantsPct, savings: netSavings, savingsPct, totalIncome: netIncomeDef, totalExp }
  }, [dSpending, dSavings])

  const healthScore = useMemo(() => {
    let score = 50
    const currentRate = dSavings.savingsRate

    if (currentRate >= savingsTarget) score += 25
    else if (currentRate > 0) score += (currentRate / savingsTarget) * 25
    else score -= 20

    if (isRunwayInfinite) score += 25
    else if (dBurn.runwayMonths >= 12) score += 25
    else if (dBurn.runwayMonths >= 6) score += 15
    else if (dBurn.runwayMonths >= 3) score += 5
    else score -= 15

    if (allocationBreakdown.wantsPct <= 25) score += 25
    else if (allocationBreakdown.wantsPct <= 35) score += 15
    else if (allocationBreakdown.wantsPct <= 50) score += 5
    else score -= 10

    if (dSavings.net > 0) score += 25
    else if (dSavings.net > -dSavings.income * 0.1) score += 10
    else score -= 10

    return Math.min(100, Math.max(0, Math.round(score)))
  }, [dSavings, dBurn, savingsTarget, isRunwayInfinite, allocationBreakdown])

  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'Needs Attention'
  const healthColor = healthScore >= 80 ? 'emerald' : healthScore >= 60 ? 'blue' : healthScore >= 40 ? 'amber' : 'red'

  const insights = useMemo(() => {
    const list: { type: 'good' | 'warning' | 'critical' | 'tip'; title: string; body: string; action?: { label: string; href: string } }[] = []

    if (dSavings.savingsRate >= savingsTarget) {
      list.push({
        type: 'good',
        title: 'Savings target met',
        body: `You're saving ${Math.round(dSavings.savingsRate)}% of income — above your ${savingsTarget}% goal.`,
      })
    } else if (dSavings.savingsRate > 0) {
      const gap = savingsTarget - dSavings.savingsRate
      const monthlyGap = (dSavings.income * (gap / 100)) / 12
      list.push({
        type: 'warning',
        title: 'Savings gap detected',
        body: `You're saving ${Math.round(dSavings.savingsRate)}%, ${Math.round(gap)} points below target. Cutting just ${format(monthlyGap)}/mo from discretionary spend closes the gap.`,
        action: { label: 'Review budgets', href: '/budgets' },
      })
    } else {
      list.push({
        type: 'critical',
        title: 'Negative savings rate',
        body: `You're spending ${format(Math.abs(dSavings.net))} more than you earn monthly. This is unsustainable.`,
        action: { label: 'See spending', href: '/transactions' },
      })
    }

    if (isRunwayInfinite) {
      list.push({
        type: 'good',
        title: 'Income covers expenses',
        body: 'Your average monthly income exceeds expenses. Your reserves are protected and growing.',
      })
    } else if (dBurn.runwayMonths >= 12) {
      list.push({
        type: 'good',
        title: 'Strong emergency buffer',
        body: `You could survive ${Math.round(dBurn.runwayMonths)} months without income.`,
      })
    } else if (dBurn.runwayMonths >= 6) {
      list.push({
        type: 'warning',
        title: 'Moderate runway',
        body: `You have ${Math.round(dBurn.runwayMonths)} months of expenses covered. Aim for 12 months.`,
        action: { label: 'Add to savings', href: '/accounts' },
      })
    } else {
      list.push({
        type: 'critical',
        title: 'Low runway — build emergency fund now',
        body: `Only ${dBurn.runwayMonths.toFixed(1)} months of expenses covered. Job loss or emergency would be devastating.`,
        action: { label: 'Open savings account', href: '/accounts/new' },
      })
    }

    if (allocationBreakdown.wantsPct > 40) {
      list.push({
        type: 'warning',
        title: 'High discretionary spend',
        body: `${Math.round(allocationBreakdown.wantsPct)}% of income goes to wants vs. ${Math.round(allocationBreakdown.needsPct)}% needs.`,
        action: { label: 'See categories', href: '/transactions' },
      })
    } else if (allocationBreakdown.needsPct > 60) {
      list.push({
        type: 'tip',
        title: 'High fixed costs',
        body: `${Math.round(allocationBreakdown.needsPct)}% of income is locked in necessities. Consider negotiating bills or increasing income.`,
      })
    }

    const recentMonths = dCashflow.slice(-3)
    const avgRecentSavings = recentMonths.reduce((s, m) => s + m.savings, 0) / Math.max(1, recentMonths.length)
    const olderMonths = dCashflow.slice(0, -3)
    const avgOlderSavings = olderMonths.reduce((s, m) => s + m.savings, 0) / Math.max(1, olderMonths.length)

    if (avgRecentSavings < avgOlderSavings * 0.7 && avgOlderSavings > 0) {
      list.push({
        type: 'warning',
        title: 'Savings trend declining',
        body: `Your recent 3-month savings average ${format(avgRecentSavings)} is down from ${format(avgOlderSavings)}.`,
        action: { label: 'View trends', href: '/portfolio' },
      })
    }

    const topSpend = dSpending[0]
    if (topSpend && topSpend.value > dSavings.income * 0.25) {
      list.push({
        type: 'tip',
        title: `${topSpend.name} is your biggest category`,
        body: `You spent ${format(topSpend.value)} on ${topSpend.name} — over 25% of income. A 10% reduction frees up ${format(topSpend.value * 0.1)}/mo.`,
      })
    }

    return list
  }, [dSavings, dBurn, isRunwayInfinite, allocationBreakdown, dCashflow, dSpending, savingsTarget, format])

  const simulatedExpenses = useMemo(() => {
    const wantsReduced = allocationBreakdown.wants * (1 - lifestyleDiscount / 100)
    return allocationBreakdown.needs + wantsReduced
  }, [allocationBreakdown, lifestyleDiscount])

  const simulatedRunway = useMemo(() => {
    if (dSavings.income >= simulatedExpenses) return Infinity
    const monthlyNetBurn = simulatedExpenses - dSavings.income
    const currentReserves = dBurn.monthlyBurn * dBurn.runwayMonths
    if (monthlyNetBurn <= 0) return Infinity
    return currentReserves / monthlyNetBurn
  }, [dSavings.income, simulatedExpenses, dBurn])

  const simulatedSavingsRate = dSavings.income > 0
    ? ((dSavings.income - simulatedExpenses) / dSavings.income) * 100
    : 0

  const projectionData = useMemo(() => {
    const months = 12
    const monthlySavings = dSavings.net
    const currentNetWorth = dBurn.netWorth
    const data = []
    for (let i = 0; i <= months; i++) {
      data.push({
        month: `M${i}`,
        projected: Math.round(currentNetWorth + monthlySavings * i),
        target: Math.round(currentNetWorth + (dSavings.income * (savingsTarget / 100)) * i),
      })
    }
    return data
  }, [dBurn.netWorth, dSavings.net, dSavings.income, savingsTarget])

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        <div className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Insights
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              Financial Health
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-md">
              Personalized analysis of your spending habits, savings efficiency, and financial trajectory.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-[11px] bg-muted px-3 py-1.5 rounded-xl border border-border/70 font-semibold flex items-center gap-1.5 text-muted-foreground">
              <Sparkles size={11} className="text-primary" aria-hidden="true" />
              Updated live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Overall Health Score
            </span>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" aria-hidden="true">
                <circle cx="64" cy="64" r="56" stroke="var(--muted)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={`var(--${healthColor}-500)`}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={mounted ? 2 * Math.PI * 56 * (1 - healthScore / 100) : 2 * Math.PI * 56}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-foreground tracking-tight">{mounted ? healthScore : '—'}</span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">/ 100</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold uppercase px-4 py-1.5 rounded-full bg-${healthColor}-500/10 text-${healthColor}-500`}>
              {healthLabel}
            </span>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 gap-3 content-start">
            <MetricCard
              label="Monthly Income"
              value={privacyMode ? '****' : format(dSavings.income)}
              icon={<TrendingUp size={16} className="text-emerald-500" />}
              trend={dSavings.income > dSavings.expense ? 'positive' : 'neutral'}
            />
            <MetricCard
              label="Monthly Expenses"
              value={privacyMode ? '****' : format(dSavings.expense)}
              icon={<TrendingDown size={16} className="text-rose-500" />}
              trend={dSavings.expense > dSavings.income * 0.7 ? 'negative' : 'neutral'}
            />
            <MetricCard
              label="Actual Savings Rate"
              value={privacyMode ? '****' : `${Math.round(dSavings.savingsRate)}%`}
              icon={<PiggyBank size={16} className="text-primary" />}
              sub={dSavings.savingsRate >= savingsTarget ? `Target: ${savingsTarget}% ✓` : `${Math.round(savingsTarget - dSavings.savingsRate)}pts below ${savingsTarget}% target`}
              trend={dSavings.savingsRate >= savingsTarget ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Runway"
              value={privacyMode ? '****' : isRunwayInfinite ? '∞ months' : `${Math.round(dBurn.runwayMonths)} months`}
              icon={<Flame size={16} className="text-orange-500" />}
              sub={isRunwayInfinite ? 'Income covers spend' : dBurn.runwayMonths < 6 ? 'Below recommended 6mo' : 'Healthy buffer'}
              trend={isRunwayInfinite || dBurn.runwayMonths >= 6 ? 'positive' : 'negative'}
            />
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-500" aria-hidden="true" />
            What to do next
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`bg-card border rounded-2xl p-4 shadow-sm space-y-2 ${
                  insight.type === 'critical' ? 'border-red-500/30 bg-red-500/[0.02]' :
                  insight.type === 'warning' ? 'border-amber-500/30 bg-amber-500/[0.02]' :
                  insight.type === 'good' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' :
                  'border-border'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0">
                    {insight.type === 'critical' ? <AlertTriangle size={14} className="text-red-500" /> :
                     insight.type === 'warning' ? <AlertTriangle size={14} className="text-amber-500" /> :
                     insight.type === 'good' ? <ShieldCheck size={14} className="text-emerald-500" /> :
                     <Target size={14} className="text-primary" />}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-xs font-bold text-foreground">{insight.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.body}</p>
                    {insight.action && (
                      <Link
                        href={insight.action.href}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-1"
                      >
                        {insight.action.label} <ChevronRight size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" aria-hidden="true" />
                Cashflow History
              </h2>
              <p className="text-[11px] text-muted-foreground">Income vs expenses over time</p>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Income</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Expense</span>
            </div>
          </div>
          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dCashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                    formatter={(value, name) => [privacyMode ? '****' : format(Number(value ?? 0), displayCurrency), name]}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" aria-hidden="true" />
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Target size={15} className="text-indigo-400" aria-hidden="true" />
                Budget Rule: 50/30/20
              </h2>
              <p className="text-[11px] text-muted-foreground">How your income is allocated</p>
            </div>

            <div className="space-y-4">
              <BudgetBar
                label="Needs — Fixed Costs"
                description="Rent, bills, groceries, transport"
                target={50}
                actual={allocationBreakdown.needsPct}
                amount={privacyMode ? '****' : format(allocationBreakdown.needs, displayCurrency)}
                color="bg-amber-500"
              />
              <BudgetBar
                label="Wants — Lifestyle"
                description="Dining, entertainment, shopping"
                target={30}
                actual={allocationBreakdown.wantsPct}
                amount={privacyMode ? '****' : format(allocationBreakdown.wants, displayCurrency)}
                color="bg-rose-500"
              />
              <BudgetBar
                label="Savings & Debt Payoff"
                description="Emergency fund, investments, extra payments"
                target={20}
                actual={allocationBreakdown.savingsPct}
                amount={privacyMode ? '****' : format(allocationBreakdown.savings, displayCurrency)}
                color="bg-emerald-500"
              />
            </div>

            <div className="bg-muted/30 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
              {allocationBreakdown.savingsPct >= 20
                ? `✓ You're allocating ${Math.round(allocationBreakdown.savingsPct)}% to savings — above the 20% recommendation.`
                : allocationBreakdown.wantsPct > 35
                ? `⚠ ${Math.round(allocationBreakdown.wantsPct)}% goes to wants. Trimming 5% would add ${format(dSavings.income * 0.05)}/mo to savings.`
                : `Your allocation is reasonable. Aim to push savings from ${Math.round(allocationBreakdown.savingsPct)}% toward 20%.`}
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <PieIcon size={15} className="text-rose-400" aria-hidden="true" />
                  Top Spending
                </h2>
                <p className="text-[11px] text-muted-foreground">This month by category</p>
              </div>
              <Link href="/transactions" className="text-[11px] font-bold text-primary hover:underline">View all</Link>
            </div>

            {dSpending.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">No expenses recorded this month.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dSpending.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground truncate">{item.name}</span>
                        <span className="font-mono font-bold text-foreground">{privacyMode ? '****' : format(item.value)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, item.percentage)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUpIcon size={15} className="text-emerald-500" aria-hidden="true" />
              Net Worth Projection
            </h2>
            <p className="text-[11px] text-muted-foreground">Where you'll be in 12 months at current pace vs. target pace</p>
          </div>
          <div className="h-56 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                    formatter={(value) => [privacyMode ? '****' : format(Number(value ?? 0)), '']}
                  />
                  <ReferenceLine y={dBurn.netWorth} stroke="var(--muted-foreground)" strokeDasharray="3 3" label={{ value: 'Today', position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }} />
                  <Line type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="Current pace" />
                  <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target pace" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" aria-hidden="true" />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              Current monthly net: <strong className="text-foreground">{privacyMode ? '****' : format(dSavings.net)}</strong>
            </span>
            <span className="text-muted-foreground">
              Target monthly net: <strong className="text-emerald-500">{privacyMode ? '****' : format(dSavings.income * (savingsTarget / 100))}</strong>
            </span>
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Flame size={15} className="text-orange-500" aria-hidden="true" />
                Lifestyle Impact Simulator
              </h2>
              <p className="text-[11px] text-muted-foreground">
                See how cutting discretionary spend affects your runway and savings rate
              </p>
            </div>
            <div className="text-xs bg-orange-500/10 text-orange-600 font-bold px-3 py-1.5 rounded-lg">
              Cut wants by: {lifestyleDiscount}%
            </div>
          </div>

          <Slider
            value={lifestyleDiscount}
            onChange={setLifestyleDiscount}
            min={0}
            max={60}
            step={5}
            label={<span className="sr-only">Lifestyle discount percentage</span>}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>No cuts</span>
            <span>60% cut</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <SimResult
              label="Monthly spend"
              before={privacyMode ? '****' : format(dSavings.expense)}
              after={privacyMode ? '****' : format(simulatedExpenses)}
              better={simulatedExpenses < dSavings.expense}
            />
            <SimResult
              label="Savings rate"
              before={`${Math.round(dSavings.savingsRate)}%`}
              after={`${Math.round(simulatedSavingsRate)}%`}
              better={simulatedSavingsRate > dSavings.savingsRate}
            />
            <SimResult
              label="Runway"
              before={isRunwayInfinite ? '∞' : `${dBurn.runwayMonths.toFixed(1)} mo`}
              after={!Number.isFinite(simulatedRunway) ? '∞' : `${simulatedRunway.toFixed(1)} mo`}
              better={!Number.isFinite(simulatedRunway) || simulatedRunway > dBurn.runwayMonths}
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/20 rounded-xl p-3">
            {lifestyleDiscount === 0
              ? 'Adjust the slider to simulate reducing discretionary spending. Even small cuts compound dramatically over time.'
              : !Number.isFinite(simulatedRunway)
              ? `At ${lifestyleDiscount}% reduction, your income would fully cover expenses — achieving financial independence at current spend levels.`
              : `A ${lifestyleDiscount}% lifestyle cut extends runway from ${dBurn.runwayMonths.toFixed(1)} to ${simulatedRunway.toFixed(1)} months and boosts savings rate to ${Math.round(simulatedSavingsRate)}%.`}
          </p>
        </section>

      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, sub, trend }: {
  label: string
  value: string
  icon: React.ReactNode
  sub?: string
  trend?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-2">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-xl font-black text-foreground tabular-nums">{value}</p>
      {sub && (
        <div className="flex items-center gap-1 text-[10px]">
          {trend === 'positive' ? <ArrowUpRight size={11} className="text-emerald-500" /> :
           trend === 'negative' ? <ArrowDownRight size={11} className="text-rose-500" /> :
           <ArrowRight size={11} className="text-muted-foreground" />}
          <span className={trend === 'positive' ? 'text-emerald-500' : trend === 'negative' ? 'text-rose-500' : 'text-muted-foreground'}>
            {sub}
          </span>
        </div>
      )}
    </div>
  )
}

function BudgetBar({ label, description, target, actual, amount, color }: {
  label: string
  description: string
  target: number
  actual: number
  amount: string
  color: string
}) {
  const diff = actual - target
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-foreground">{label}</span>
          <span className="text-muted-foreground ml-1.5 text-[10px]">{description}</span>
        </div>
        <span className="font-mono font-bold text-foreground">{amount}</span>
      </div>
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, actual))}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground/40"
          style={{ left: `${target}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">Target: {target}%</span>
        <span className={diff > 5 ? 'text-rose-500 font-semibold' : diff < -5 ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'}>
          Actual: {Math.round(actual)}% {diff > 5 ? '(over)' : diff < -5 ? '(under)' : ''}
        </span>
      </div>
    </div>
  )
}

function SimResult({ label, before, after, better }: {
  label: string
  before: string
  after: string
  better: boolean
}) {
  return (
    <div className="bg-muted/20 border border-border/40 rounded-xl p-3.5 space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground line-through">{before}</span>
        <span className={`text-sm font-extrabold font-mono ${better ? 'text-emerald-500' : 'text-foreground'}`}>{after}</span>
        {better && <ArrowUpRight size={12} className="text-emerald-500" />}
      </div>
    </div>
  )
}