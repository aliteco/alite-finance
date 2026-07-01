// filepath: alite/src/components/portfolio-view.tsx
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useCurrency } from '@/components/currency-provider'
import { usePrivacyMode } from '@/lib/hooks/use-privacy-mode'
import Slider from '@/components/ui/slider'
import {
  Briefcase, PieChart, LineChart as LineIcon, Coins, TrendingUp, TrendingDown,
  Target, Calculator, Zap, ShieldAlert, ArrowUpRight, ArrowDownRight,
  Wallet, Landmark, CreditCard, Gem, CircleDollarSign
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis,
} from 'recharts'

interface Account {
  id: string
  name: string
  currency: string
  balance: number
  type: string
  color?: string | null
}

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  cash: { label: 'Cash Reserves', color: '#f59e0b', icon: <Wallet size={14} /> },
  bank: { label: 'Liquid Checking', color: '#3b82f6', icon: <Landmark size={14} /> },
  savings: { label: 'High Yield Savings', color: '#10b981', icon: <CircleDollarSign size={14} /> },
  investment: { label: 'Brokerage & Stocks', color: '#8b5cf6', icon: <TrendingUp size={14} /> },
  credit_card: { label: 'Credit Cards', color: '#ef4444', icon: <CreditCard size={14} /> },
  other: { label: 'Alternative Assets', color: '#6b7280', icon: <Gem size={14} /> },
}

export default function PortfolioView({
  initialAccounts,
  baseCurrency,
}: {
  initialAccounts: Account[]
  baseCurrency: string
}) {
  const { convert, format, isLoadingRates } = useCurrency()
  const privacyMode = usePrivacyMode()
  const [mounted, setMounted] = useState(false)
  const [annualContribution, setAnnualContribution] = useState(12000)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [years, setYears] = useState(10)
  const [showScheduleTable, setShowScheduleTable] = useState(false)
  const [annualExpenseTarget, setAnnualExpenseTarget] = useState(36000)
  const [scenarioMode, setScenarioMode] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate')

  useEffect(() => {
    setMounted(true)
  }, [])

  const accounts = initialAccounts

  const allocationData = useMemo(() => {
    const typesMap: Record<string, { name: string; value: number; color: string; count: number; icon: React.ReactNode }> = {}
    Object.entries(TYPE_META).forEach(([key, meta]) => {
      typesMap[key] = { name: meta.label, value: 0, color: meta.color, count: 0, icon: meta.icon }
    })
    accounts.forEach(acc => {
      const type = acc.type || 'other'
      const valInDisplay = convert(acc.balance, acc.currency)
      const bucket = typesMap[type] ?? typesMap.other
      bucket.value += valInDisplay
      bucket.count += 1
    })
    return Object.values(typesMap)
      .filter(item => Math.abs(item.value) > 0)
      .map(item => ({ ...item, value: parseFloat(Math.abs(item.value).toFixed(2)) }))
  }, [accounts, convert])

  const totalAssetsValue = useMemo(
    () => accounts.reduce((sum, acc) => (acc.balance > 0 ? sum + convert(acc.balance, acc.currency) : sum), 0),
    [accounts, convert]
  )
  const totalLiabilitiesValue = useMemo(
    () => accounts.reduce((sum, acc) => (acc.balance < 0 ? sum + Math.abs(convert(acc.balance, acc.currency)) : sum), 0),
    [accounts, convert]
  )
  const netWorth = totalAssetsValue - totalLiabilitiesValue

  const scenarioReturns = { conservative: 5, moderate: 8, aggressive: 12 }
  const effectiveReturn = scenarioReturns[scenarioMode]

  const compoundedGrowthTimeline = useMemo(() => {
    const list = []
    let principal = Math.max(0, netWorth)
    const rate = effectiveReturn / 100
    for (let yr = 0; yr <= years; yr++) {
      let val = principal * Math.pow(1 + rate, yr)
      if (yr > 0) {
        for (let j = 1; j <= yr; j++) {
          val += annualContribution * Math.pow(1 + rate, yr - j)
        }
      }
      list.push({ year: `Year ${yr}`, 'Portfolio Future': Math.round(val) })
    }
    return list
  }, [netWorth, annualContribution, effectiveReturn, years])

  const fireTarget = annualExpenseTarget * 25
  const firePct = fireTarget > 0 ? Math.min(100, Math.round((netWorth / fireTarget) * 100)) : 0
  const yearsToFire = useMemo(() => {
    if (netWorth >= fireTarget) return 0
    if (annualContribution <= 0) return Infinity
    const rate = effectiveReturn / 100
    let projected = netWorth
    for (let yr = 0; yr <= 50; yr++) {
      if (projected >= fireTarget) return yr
      projected = projected * (1 + rate) + annualContribution
    }
    return 50
  }, [netWorth, fireTarget, annualContribution, effectiveReturn])

  const leverageRatio = totalAssetsValue > 0 ? totalLiabilitiesValue / totalAssetsValue : 0
  const liquidRatio = totalAssetsValue > 0
    ? ((allocationData.find(a => a.name === TYPE_META.cash.label)?.value ?? 0) +
      (allocationData.find(a => a.name === TYPE_META.bank.label)?.value ?? 0)) / totalAssetsValue
    : 0

  if ((isLoadingRates && accounts.length > 0) || !mounted) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6" aria-busy="true" aria-live="polite">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-44 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20 space-y-4">
        <Briefcase size={32} className="mx-auto text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold text-foreground">No accounts to analyze yet</h1>
        <p className="text-sm text-muted-foreground">
          Add at least one account to see asset allocation and growth projections.
        </p>
        <Link
          href="/accounts/new"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2"
        >
          + Add account
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase size={20} className="text-primary" aria-hidden="true" /> Portfolio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete view of your assets, debt, and path to financial independence.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Gross Assets"
          value={privacyMode ? '******' : format(totalAssetsValue)}
          icon={<Coins size={16} className="text-emerald-500" />}
          trend={totalAssetsValue > totalLiabilitiesValue * 2 ? { label: 'Strong position', dir: 'up' } : undefined}
        />
        <MetricCard
          label="Gross Liabilities"
          value={privacyMode ? '******' : format(totalLiabilitiesValue)}
          icon={<TrendingDown size={16} className="text-rose-500" />}
          accent="expense"
        />
        <MetricCard
          label="Net Worth"
          value={privacyMode ? '******' : format(netWorth)}
          icon={<TrendingUp size={16} className="text-primary" />}
          accent="primary"
          trend={netWorth > 0 ? { label: 'Positive', dir: 'up' } : { label: 'Negative', dir: 'down' }}
        />
      </div>

      {(leverageRatio > 0.15 || liquidRatio < 0.1) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leverageRatio > 0.15 && (
            <AlertCard
              level={leverageRatio > 0.4 ? 'critical' : 'warning'}
              title={leverageRatio > 0.4 ? 'High debt burden' : 'Moderate leverage'}
              body={`Debt is ${(leverageRatio * 100).toFixed(1)}% of assets. ${leverageRatio > 0.4 ? 'Prioritize paying down high-interest debt before investing more.' : 'Keep monitoring — aim for under 15%.'}`}
            />
          )}
          {liquidRatio < 0.1 && totalAssetsValue > 0 && (
            <AlertCard
              level="tip"
              title="Low liquid reserves"
              body={`Only ${(liquidRatio * 100).toFixed(0)}% of assets are liquid. Maintain 10-20% in cash/bank for emergencies.`}
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <PieChart size={14} className="text-primary" aria-hidden="true" /> Asset Allocation
          </h3>
          {allocationData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">No asset data found.</p>
          ) : (
            <>
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie data={allocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={4} dataKey="value">
                      {allocationData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [privacyMode ? '******' : format(Number(v)), '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {allocationData.map(item => {
                  const pctVal = totalAssetsValue > 0 ? (item.value / totalAssetsValue) * 100 : 0
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs bg-muted/15 border border-border/25 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <span className="truncate text-foreground font-semibold block">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.count} account{item.count !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold tabular-nums text-foreground block">{privacyMode ? '******' : format(item.value)}</span>
                        <span className="text-[10px] text-muted-foreground">{Math.round(pctVal)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <LineIcon size={14} className="text-primary" aria-hidden="true" /> Growth Projection
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Compound growth at {effectiveReturn}% return scenario
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-muted p-0.5 rounded-lg">
                {(['conservative', 'moderate', 'aggressive'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setScenarioMode(s)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all capitalize ${
                      scenarioMode === s
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowScheduleTable(!showScheduleTable)}
                className="text-xs bg-muted hover:bg-muted-foreground/10 px-3 py-1.5 rounded-xl border border-border transition-colors font-semibold text-foreground shrink-0"
              >
                {showScheduleTable ? 'Chart' : 'Table'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 border border-border/30 p-4 rounded-xl">
            <Slider
              label={<span className="text-[10px] font-bold uppercase text-muted-foreground">Annual additions: <span className="text-primary">{privacyMode ? '******' : format(annualContribution)}</span></span>}
              value={annualContribution}
              onChange={setAnnualContribution}
              min={0}
              max={100000}
              step={2500}
            />
            <Slider
              label={<span className="text-[10px] font-bold uppercase text-muted-foreground">Expected yield: <span className="text-primary">{expectedReturn}%</span></span>}
              value={expectedReturn}
              onChange={setExpectedReturn}
              min={1}
              max={20}
              step={0.5}
            />
            <Slider
              label={<span className="text-[10px] font-bold uppercase text-muted-foreground">Time horizon: <span className="text-primary">{years} yrs</span></span>}
              value={years}
              onChange={setYears}
              min={2}
              max={30}
              step={1}
            />
          </div>

          {showScheduleTable ? (
            <div className="border border-border rounded-xl overflow-x-auto max-h-[260px]">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/30 border-b border-border">
                  <tr><th scope="col" className="px-4 py-2.5">Year</th><th scope="col" className="px-4 py-2.5 text-right">Projected Value</th><th scope="col" className="px-4 py-2.5 text-right">Growth</th></tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {compoundedGrowthTimeline.map((item, idx) => {
                    const prev = idx > 0 ? compoundedGrowthTimeline[idx - 1]['Portfolio Future'] : item['Portfolio Future']
                    const growth = item['Portfolio Future'] - prev
                    return (
                      <tr key={idx} className={idx === 0 ? 'bg-muted/10' : ''}>
                        <td className="px-4 py-2.5 font-semibold text-foreground">{item.year}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-primary tabular-nums">{privacyMode ? '******' : format(item['Portfolio Future'])}</td>
                        <td className="px-4 py-2.5 text-right text-[10px] text-muted-foreground tabular-nums">{idx === 0 ? '—' : `+${format(growth)}`}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={compoundedGrowthTimeline} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portfolioGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 12 }} formatter={(v) => [privacyMode ? '******' : format(Number(v)), '']} />
                  <Area type="monotone" dataKey="Portfolio Future" stroke="#8b5cf6" strokeWidth={3} fill="url(#portfolioGrowthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div className="bg-muted/15 p-3 rounded-xl border border-border/30">
              <span className="text-muted-foreground">Starting value</span>
              <p className="font-bold text-foreground mt-0.5">{privacyMode ? '******' : format(Math.max(0, netWorth))}</p>
            </div>
            <div className="bg-muted/15 p-3 rounded-xl border border-border/30">
              <span className="text-muted-foreground">Total contributed</span>
              <p className="font-bold text-foreground mt-0.5">{privacyMode ? '******' : format(annualContribution * years)}</p>
            </div>
            <div className="bg-muted/15 p-3 rounded-xl border border-border/30">
              <span className="text-muted-foreground">Est. final value</span>
              <p className="font-bold text-primary mt-0.5">{privacyMode ? '******' : format(compoundedGrowthTimeline[compoundedGrowthTimeline.length - 1]?.['Portfolio Future'] ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <Target size={16} className="text-primary" /> Financial Independence (FIRE)
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Track progress toward covering expenses purely from portfolio returns.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/20 border border-border/40 p-2 rounded-xl text-xs font-semibold tabular-nums">
            <label htmlFor="fire-target" className="text-muted-foreground">Annual expenses:</label>
            <input
              id="fire-target"
              type="number" min="1000" max="500000" step="1000" value={annualExpenseTarget}
              onChange={(e) => setAnnualExpenseTarget(Number(e.target.value) || 0)}
              className="w-24 bg-transparent text-primary font-bold focus:outline-none text-right"
            />
            <span className="text-muted-foreground">/yr</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <FireMetric label="Current net worth" value={privacyMode ? '******' : format(netWorth)} />
          <FireMetric label="FIRE target (25×)" value={privacyMode ? '******' : format(fireTarget)} accent="indigo" />
          <FireMetric label="Progress" value={`${firePct}%`} accent={firePct >= 100 ? 'emerald' : firePct >= 50 ? 'primary' : 'amber'} />
          <FireMetric
            label="Est. years to FIRE"
            value={yearsToFire === 0 ? 'Achieved!' : yearsToFire === Infinity ? '∞' : `${yearsToFire} yrs`}
            accent={yearsToFire === 0 ? 'emerald' : yearsToFire <= 10 ? 'primary' : yearsToFire <= 20 ? 'amber' : 'rose'}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Progress to FIRE</span>
            <span className="font-bold text-foreground">{firePct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={firePct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, firePct)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {firePct >= 100
              ? 'You have reached financial independence! Your portfolio can sustainably cover your annual expenses.'
              : yearsToFire === Infinity
              ? 'At current savings rate, you are not making progress. Increase contributions or reduce expenses.'
              : `At ${scenarioMode} returns (${effectiveReturn}%) and ${format(annualContribution)}/yr contributions, you could reach FIRE in ~${yearsToFire} years.`}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {[
            { pct: 25, label: 'Coast FI', desc: 'Portfolio growing on its own' },
            { pct: 50, label: 'Halfway', desc: 'Half your target reached' },
            { pct: 75, label: 'Lean FI', desc: 'Could survive frugally' },
            { pct: 100, label: 'Full FI', desc: 'Full financial independence' },
          ].map(m => {
            const achieved = firePct >= m.pct
            return (
              <div
                key={m.pct}
                className={`p-3 rounded-xl border text-center space-y-1 ${
                  achieved
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/10 border-border/30 opacity-50'
                }`}
              >
                <p className="text-lg font-black text-foreground">{m.pct}%</p>
                <p className="text-[10px] font-bold text-foreground">{m.label}</p>
                <p className="text-[9px] text-muted-foreground">{m.desc}</p>
                {achieved && <Zap size={12} className="text-primary mx-auto mt-0.5" />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, accent, trend }: {
  label: string
  value: string
  icon: React.ReactNode
  accent?: 'expense' | 'primary'
  trend?: { label: string; dir: 'up' | 'down' }
}) {
  const colorClass = accent === 'expense' ? 'text-rose-500' : accent === 'primary' ? 'text-primary' : 'text-foreground'
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
      <div className="flex justify-between items-center text-muted-foreground">
        <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-black tabular-nums ${colorClass}`}>{value}</p>
      {trend && (
        <div className="flex items-center gap-1 text-[10px]">
          {trend.dir === 'up' ? <ArrowUpRight size={11} className="text-emerald-500" /> : <ArrowDownRight size={11} className="text-rose-500" />}
          <span className={trend.dir === 'up' ? 'text-emerald-500' : 'text-rose-500'}>{trend.label}</span>
        </div>
      )}
    </div>
  )
}

function AlertCard({ level, title, body }: {
  level: 'critical' | 'warning' | 'tip'
  title: string
  body: string
}) {
  const colors = {
    critical: { border: 'border-red-500/30', bg: 'bg-red-500/[0.03]', icon: <ShieldAlert size={14} className="text-red-500" /> },
    warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.03]', icon: <Zap size={14} className="text-amber-500" /> },
    tip: { border: 'border-blue-500/30', bg: 'bg-blue-500/[0.03]', icon: <Calculator size={14} className="text-blue-500" /> },
  }
  const c = colors[level]
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${c.border} ${c.bg}`}>
      <span className="mt-0.5 shrink-0">{c.icon}</span>
      <div>
        <h4 className="text-xs font-bold text-foreground">{title}</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{body}</p>
      </div>
    </div>
  )
}

function FireMetric({ label, value, accent }: {
  label: string
  value: string
  accent?: 'indigo' | 'emerald' | 'primary' | 'amber' | 'rose'
}) {
  const colorMap = {
    indigo: 'text-indigo-500',
    emerald: 'text-emerald-500',
    primary: 'text-primary',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
  }
  return (
    <div className="bg-muted/10 p-3.5 rounded-xl border border-border/30 text-center">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className={`text-lg font-extrabold mt-0.5 ${accent ? colorMap[accent] : 'text-foreground'}`}>{value}</p>
    </div>
  )
}