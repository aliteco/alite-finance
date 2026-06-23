// filepath: /src/app/(app)/portfolio/page.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Account, CURRENCY_SYMBOLS } from '@/lib/finance-engine'
import { useCurrency } from '@/components/currency-provider'
import {
  Briefcase,
  PieChart,
  LineChart as LineIcon,
  Coins,
  DollarSign,
  TrendingUp,
  Landmark,
  Wallet,
  Compass,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts'

export default function PortfolioPage() {
  const { displayCurrency, convert, format, isLoadingRates } = useCurrency()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  
  // Custom compounding tool states
  const [annualContribution, setAnnualContribution] = useState(12000)
  const [expectedReturn, setExpectedReturn] = useState(8)
  const [years, setYears] = useState(10)

  // Extra state features
  const [privacyEnabled, setPrivacyEnabled] = useState(false)
  const [showScheduleTable, setShowScheduleTable] = useState(false)
  
  // FIRE simulation states
  const [annualExpenseTarget, setAnnualExpenseTarget] = useState(36000)

  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: accts } = await supabase
        .from('accounts')
        .select('id, name, currency, balance, type, color')
        .eq('user_id', user.id)
        .eq('is_active', true)

      setAccounts((accts as unknown as Account[]) || [])
      setLoading(false)
    }
    fetchAccounts()

    // Setup privacy listener
    const checkPrivacy = () => {
      setPrivacyEnabled(localStorage.getItem('alite_privacy_mode') === 'true')
    }
    checkPrivacy()
    window.addEventListener('alite_privacy_changed', checkPrivacy)
    return () => {
      window.removeEventListener('alite_privacy_changed', checkPrivacy)
    }
  }, [])

  // Helper helper to obscure value when privacy mode is active
  const wrapPrivacy = (formatted: string) => {
    return privacyEnabled ? '••••' : formatted
  }

  // 1. Group by Asset Types
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
      
      // Credit card is a liability but we show positive size or subtract in net asset logic
      if (typesMap[type]) {
        typesMap[type].value += valInDisplay
        typesMap[type].count += 1
      } else {
        typesMap['other'].value += valInDisplay
        typesMap['other'].count += 1
      }
    })

    return Object.values(typesMap)
      .filter(item => Math.abs(item.value) > 0)
      .map(item => ({
        ...item,
        value: parseFloat(Math.abs(item.value).toFixed(2)) // Use positive size for pie slice
      }))
  }, [accounts, convert])

  // Aggregate net wealth
  const totalAssetsValue = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if (acc.balance > 0) {
        return sum + convert(acc.balance, acc.currency)
      }
      return sum;
    }, 0)
  }, [accounts, convert])

  const totalLiabilitiesValue = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      if (acc.balance < 0) {
        return sum + Math.abs(convert(acc.balance, acc.currency))
      }
      return sum;
    }, 0)
  }, [accounts, convert])

  // 2. Projected Compound Growth Chart data
  const compoundedGrowthTimeline = useMemo(() => {
    const list = []
    let principal = totalAssetsValue - totalLiabilitiesValue
    if (principal < 0) principal = 0 // prevent starting with debt compound issues

    const rate = expectedReturn / 100

    for (let yr = 0; yr <= years; yr++) {
      let val = principal * Math.pow(1 + rate, yr)
      // Accumulate intermediate contributions post compounding
      if (yr > 0) {
        for (let j = 1; j <= yr; j++) {
          val += annualContribution * Math.pow(1 + rate, yr - j)
        }
      }
      list.push({
        year: `Year ${yr}`,
        'Portfolio Future': Math.round(val)
      })
    }
    return list
  }, [totalAssetsValue, totalLiabilitiesValue, annualContribution, expectedReturn, years])

  if (loading || isLoadingRates) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-muted animate-pulse rounded-2xl" />
          <div className="h-44 bg-muted animate-pulse rounded-2xl" />
          <div className="h-44 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase size={22} className="text-primary" /> Asset Allocation & Portfolio
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Diversification profiles and active Return on Investment (ROI) simulators.
          </p>
        </div>
        <div className="text-xs bg-muted border border-border/60 px-3 py-1.5 rounded-xl font-bold text-muted-foreground">
          Real-time rates synchronized
        </div>
      </div>

      {/* Bento Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gross Assets</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground tabular-nums">{wrapPrivacy(format(totalAssetsValue))}</p>
          <p className="text-[10px] text-muted-foreground">Total cash reserves, banks, shares</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Gross Liabilities</span>
            <TrendingDown className="w-4 h-4 text-expense" />
          </div>
          <p className="text-2xl font-black text-expense tabular-nums">{wrapPrivacy(format(totalLiabilitiesValue))}</p>
          <p className="text-[10px] text-muted-foreground">Credit cards and unpaid debts</p>
        </div>

        <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[10px] uppercase font-bold tracking-wider">Net Equity Worth</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-primary tabular-nums">
            {wrapPrivacy(format(totalAssetsValue - totalLiabilitiesValue))}
          </p>
          <p className="text-[10px] text-muted-foreground">Ownership interest converted</p>
        </div>
      </div>

      {/* Debt Quality Lever Gauge */}
      {totalAssetsValue > 0 && (
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-foreground">Debt Leverage Index</h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              Your liabilities swallow <span className="font-bold text-foreground font-mono">{((totalLiabilitiesValue / totalAssetsValue) * 100).toFixed(1)}%</span> of your total holdings. 
              {totalLiabilitiesValue / totalAssetsValue > 0.4 
                ? ' High gearing ratio represents severe financial risk. Prioritize structural consumer credit card payoffs.'
                : totalLiabilitiesValue / totalAssetsValue > 0.15 
                ? ' Moderate gearing is healthy for short-term liquidity, but pay attention to outstanding card rates.'
                : ' Pristine liquidity cushion. Excellent wealth health shielding.'}
            </p>
          </div>
          <div className="w-full md:w-56 space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
              <span>LEVERAGE SPEED</span>
              <span className={totalLiabilitiesValue / totalAssetsValue > 0.4 ? 'text-expense' : 'text-emerald-500'}>
                {totalLiabilitiesValue / totalAssetsValue > 0.4 ? 'CRITICAL' : totalLiabilitiesValue / totalAssetsValue > 0.15 ? 'WARNING' : 'SECURE'}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
              <div 
                className="h-full rounded-l-full bg-emerald-500 transition-all" 
                style={{ width: `${Math.min(100, Math.max(0, 100 - ((totalLiabilitiesValue / totalAssetsValue) * 100)))}%` }} 
              />
              <div 
                className="h-full rounded-r-full bg-expense transition-all" 
                style={{ width: `${Math.min(100, (totalLiabilitiesValue / totalAssetsValue) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Allocation Pie Chart */}
        <div className="lg:col-span-4 bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <PieChart size={14} className="text-primary" /> Asset Allocation
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Asset dispersion profile across accounts</p>
          </div>

          {allocationData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-10">No asset data found.</p>
          ) : (
            <div className="space-y-4">
              <div className="h-44 relative flex items-center justify-center pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [wrapPrivacy(format(Number(v))), '']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">Dispersion</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 pt-2 max-h-52 overflow-y-auto pr-1">
                {allocationData.map((item) => {
                  const pct = totalAssetsValue > 0 ? (item.value / totalAssetsValue) * 100 : 0
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs font-medium bg-muted/15 border border-border/25 p-2 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate pr-1 text-foreground font-bold">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold tabular-nums text-foreground">{wrapPrivacy(format(item.value))}</span>
                        <span className="text-[10px] text-muted-foreground ml-1 font-mono">({Math.round(pct)}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Growth Forecasting & Simulator */}
        <div className="lg:col-span-8 bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <LineIcon size={14} className="text-primary" /> ROI Compound Projection
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Asset compounding over time with customized annual additions</p>
            </div>
            <button 
              onClick={() => setShowScheduleTable(!showScheduleTable)}
              className="text-xs bg-muted hover:bg-muted-foreground/10 px-3 py-1.5 rounded-xl border border-border transition-colors font-semibold shadow-sm text-foreground shrink-0"
            >
              {showScheduleTable ? 'View Chart' : 'View Yearly Schedule'}
            </button>
          </div>

          {/* Controls bento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 border border-border/30 p-4 rounded-xl">
            <div className="space-y-1">
              <label htmlFor="portfolio-contrib-slider" className="text-[10px] font-bold uppercase text-muted-foreground block">
                Annual Additions: <span className="text-primary font-mono">{format(annualContribution)}</span>
              </label>
              <input
                id="portfolio-contrib-slider"
                type="range"
                min="0"
                max="100000"
                step="2500"
                value={annualContribution}
                onChange={(e) => setAnnualContribution(Number(e.target.value))}
                className="w-full accent-primary h-1 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="portfolio-roi-slider" className="text-[10px] font-bold uppercase text-muted-foreground block">
                Expected Yield: <span className="text-primary font-mono">{expectedReturn}%</span>
              </label>
              <input
                id="portfolio-roi-slider"
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-primary h-1 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="portfolio-year-slider" className="text-[10px] font-bold uppercase text-muted-foreground block">
                Time Horizon: <span className="text-primary font-mono">{years} Years</span>
              </label>
              <input
                id="portfolio-year-slider"
                type="range"
                min="2"
                max="30"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-primary h-1 cursor-pointer"
              />
            </div>
          </div>

          {showScheduleTable ? (
            <div className="border border-border/60 rounded-xl overflow-x-auto max-h-[260px]">
              <table className="w-full text-xs text-left text-muted-foreground">
                <thead className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/30 border-b border-border">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">Timeline</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Projected Wealth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {compoundedGrowthTimeline.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{item.year}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary font-mono tabular-nums">
                        {wrapPrivacy(format(item['Portfolio Future']))}
                      </td>
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
                    <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#888' }}
                    tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }}
                    formatter={(value) => [wrapPrivacy(format(Number(value))), '']}
                  />
                  <Area type="monotone" dataKey="Portfolio Future" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* FIRE Retire Early Financial Independence Simulator */}
      <div className="bg-card border border-border/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span>🔥</span> FIRE (Financial Independence, Retire Early) Indicator
            </h3>
            <p className="text-xs text-muted-foreground mr-4">
              Determine when your liquid nest egg represents complete monetary immunity using the standard 4% Safe Withdrawal Rule.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted/20 border border-border/40 p-2 rounded-xl text-xs font-semibold tabular-nums text-foreground">
            <span>Target Expenses:</span>
            <input 
              type="number"
              min="1000"
              max="500000"
              step="1000"
              value={annualExpenseTarget}
              onChange={(e) => setAnnualExpenseTarget(Number(e.target.value) || 0)}
              className="w-24 bg-transparent text-primary font-bold focus:outline-none text-right font-mono"
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Combined Nest Egg</p>
                  <p className="text-lg font-extrabold text-foreground font-mono mt-0.5">{wrapPrivacy(format(netWorth))}</p>
                </div>
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Needed for 4% rule (25x)</p>
                  <p className="text-lg font-extrabold text-indigo-500 font-mono mt-0.5">{wrapPrivacy(format(targetNeeded))}</p>
                </div>
                <div className="bg-muted/10 p-3.5 rounded-xl border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">FIRE Milestone Ratio</p>
                  <p className="text-lg font-extrabold text-primary font-mono mt-0.5">{firePct}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-primary transition-all duration-500" 
                    style={{ width: `${firePct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {firePct >= 100 
                    ? '🎉 Incredible! You have attained total financial separation with the 4% rule. Your investment portfolio generate-capacity entirely shields your yearly lifestyle expense!'
                    : `You have successfully structured ${firePct}% of your FIRE target egg. To retire securely and draw down ${format(annualExpenseTarget)} index-adjusted per year, you need an extra ${wrapPrivacy(format(Math.max(0, targetNeeded - netWorth)))}.`}
                </p>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
