// filepath: alite/src/components/portfolio-view.tsx
'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useCurrency } from '@/components/currency-provider'
import {
  Briefcase, PieChart, LineChart as LineIcon, Coins, TrendingUp, TrendingDown,
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

export default function PortfolioView({
  initialAccounts,
  baseCurrency,
}: {
  initialAccounts: Account[]
  baseCurrency: string
}) {
  const { convert, format, isLoadingRates } = useCurrency()
  const [mounted, setMounted] = useState(false)
  const [annualContribution, setAnnualContribution] = useState(12000)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [years, setYears] = useState(10)
  const [showScheduleTable, setShowScheduleTable] = useState(false)
  const [annualExpenseTarget, setAnnualExpenseTarget] = useState(36000)

  useEffect(() => {
    setMounted(true)
  }, [])

  const accounts = initialAccounts

  const allocationData = useMemo(() => {
    const typesMap: Record<string, { name: string; value: number; color: string; count: number }> = {
      cash: { name: 'Cash Reserves', value: 0, color: '#f59e0b', count: 0 },
      bank: { name: 'Liquid Checking', value: 0, color: '#3b82f6', count: 0 },
      savings: { name: 'High Yield Savings', value: 0, color: '#10b981', count: 0 },
      investment: { name: 'Brokerage & Stocks', value: 0, color: '#8b5cf6', count: 0 },
      credit_card: { name: 'Credit Cards', value: 0, color: '#ef4444', count: 0 },
      other: { name: 'Alternative Assets', value: 0, color: '#6b7280', count: 0 },
    }
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

  const compoundedGrowthTimeline = useMemo(() => {
    const list = []
    let principal = totalAssetsValue - totalLiabilitiesValue
    if (principal < 0) principal = 0
    const rate = expectedReturn / 100
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
  }, [totalAssetsValue, totalLiabilitiesValue, annualContribution, expectedReturn, years])

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

  const leverageRatio = totalAssetsValue > 0 ? totalLiabilitiesValue / totalAssetsValue : 0

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase size={20} className="text-primary" aria-hidden="true" /> Portfolio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Asset allocation across your accounts, normalized to {baseCurrency}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gross Assets</span>
            <Coins className="w-4 h-4 text-emerald-500" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-foreground tabular-nums">{format(totalAssetsValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gross Liabilities</span>
            <TrendingDown className="w-4 h-4 text-expense" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-expense tabular-nums">{format(totalLiabilitiesValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Net Worth</span>
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-black text-primary tabular-nums">
            {format(totalAssetsValue - totalLiabilitiesValue)}
          </p>
        </div>
      </div>

      {totalAssetsValue > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Debt leverage</h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              Liabilities are <span className="font-bold text-foreground">{(leverageRatio * 100).toFixed(1)}%</span> of total assets.
              {leverageRatio > 0.4
                ? ' High — consider prioritizing debt payoff.'
                : leverageRatio > 0.15
                ? ' Moderate — keep an eye on it.'
                : ' Low — healthy buffer.'}
            </p>
          </div>
          <div
            className="w-full md:w-56 h-2 rounded-full bg-muted overflow-hidden flex"
            role="img"
            aria-label={`${(leverageRatio * 100).toFixed(0)} percent leveraged`}
          >
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, 100 - leverageRatio * 100))}%` }} />
            <div className="h-full bg-expense" style={{ width: `${Math.min(100, leverageRatio * 100)}%` }} />
          </div>
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
                    <Tooltip formatter={(v) => [format(Number(v)), '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {allocationData.map(item => {
                  const pctVal = totalAssetsValue > 0 ? (item.value / totalAssetsValue) * 100 : 0
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs bg-muted/15 border border-border/25 p-2 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                        <span className="truncate text-foreground font-semibold">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold tabular-nums text-foreground">{format(item.value)}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">({Math.round(pctVal)}%)</span>
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <LineIcon size={14} className="text-primary" aria-hidden="true" /> Growth Projection
            </h3>
            <button
              onClick={() => setShowScheduleTable(!showScheduleTable)}
              className="text-xs bg-muted hover:bg-muted-foreground/10 px-3 py-1.5 rounded-xl border border-border transition-colors font-semibold text-foreground shrink-0 focus-visible:ring-2"
            >
              {showScheduleTable ? 'View Chart' : 'View Schedule'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 border border-border/30 p-4 rounded-xl">
            <div className="space-y-1">
              <label htmlFor="contrib-slider" className="text-[10px] font-bold uppercase text-muted-foreground block">
                Annual additions: <span className="text-primary">{format(annualContribution)}</span>
              </label>
              <input id="contrib-slider" type="range" min="0" max="100000" step="2500" value={annualContribution}
                onChange={(e) => setAnnualContribution(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label htmlFor="roi-slider" className="text-[10px] font-bold uppercase text-muted-foreground block">
                Expected yield: <span className="text-primary">{expectedReturn}%</span>
              </label>
              <input id="roi-slider" type="range" min="1" max="20" step="0.5" value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label htmlFor="year-slider" className="text-[10px] font-bold uppercase text-muted-foreground block">
                Time horizon: <span className="text-primary">{years} yrs</span>
              </label>
              <input id="year-slider" type="range" min="2" max="30" step="1" value={years}
                onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer" />
            </div>
          </div>

          {showScheduleTable ? (
            <div className="border border-border rounded-xl overflow-x-auto max-h-[260px]">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/30 border-b border-border">
                  <tr><th scope="col" className="px-4 py-2.5">Year</th><th scope="col" className="px-4 py-2.5 text-right">Projected</th></tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {compoundedGrowthTimeline.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2.5 font-semibold text-foreground">{item.year}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary tabular-nums">{format(item['Portfolio Future'])}</td>
                    </tr>
                  ))}
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
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: 12 }} formatter={(v) => [format(Number(v)), '']} />
                  <Area type="monotone" dataKey="Portfolio Future" stroke="#8b5cf6" strokeWidth={3} fill="url(#portfolioGrowthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-bold tracking-tight text-foreground">FIRE Indicator</h3>
          <div className="flex items-center gap-2 bg-muted/20 border border-border/40 p-2 rounded-xl text-xs font-semibold tabular-nums">
            <label htmlFor="fire-target" className="text-muted-foreground">Target expenses:</label>
            <input
              id="fire-target"
              type="number" min="1000" max="500000" step="1000" value={annualExpenseTarget}
              onChange={(e) => setAnnualExpenseTarget(Number(e.target.value) || 0)}
              className="w-24 bg-transparent text-primary font-bold focus:outline-none text-right"
            />
            <span className="text-muted-foreground">/ yr</span>
          </div>
        </div>
        {(() => {
          const netWorth = totalAssetsValue - totalLiabilitiesValue
          const targetNeeded = annualExpenseTarget * 25
          const firePct = targetNeeded > 0 ? Math.min(100, Math.round((netWorth / targetNeeded) * 100)) : 0
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Net worth</p>
                  <p className="text-lg font-extrabold text-foreground mt-0.5">{format(netWorth)}</p>
                </div>
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Needed (25x)</p>
                  <p className="text-lg font-extrabold text-indigo-500 mt-0.5">{format(targetNeeded)}</p>
                </div>
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase">Progress</p>
                  <p className="text-lg font-extrabold text-primary mt-0.5">{firePct}%</p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={firePct} aria-valuemin={0} aria-valuemax={100} aria-label="FIRE progress">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${firePct}%` }} />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}