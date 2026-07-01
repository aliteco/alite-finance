// filepath: alite/src/components/dashboard-shell.tsx

'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank,
  Search, AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'
import KpiCard from '@/components/dashboard/kpi-card'
import QuickActionsBar from '@/components/dashboard/quick-actions-bar'
import NetWorthHero from '@/components/dashboard/net-worth-hero'
import AccountsRail from '@/components/dashboard/accounts-rail'
import DateRangePicker, { type CustomRange } from '@/components/dashboard/date-range-picker'
import { renderCategoryIcon } from '@/lib/icons'
import { useCurrency } from '@/components/currency-provider'
import { usePrivacyMode } from '@/lib/hooks/use-privacy-mode'

interface Category {
  id: string
  name: string
  color: string | null
  icon: string | null
}

interface Account {
  id: string
  name: string
  currency: string
  balance: number
  type: string
  color?: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  base_currency_amount: number
  currency: string
  description: string | null
  date: string
  created_at: string
  transfer_id: string | null
  transfer_type: 'debit' | 'credit' | null
  categories: Category | null
  accounts: { id: string; name: string; currency: string } | null
}

interface Budget {
  id: string
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  category_id: string | null
  categories: Category | null
}

interface BudgetProgressLite {
  budget_id: string
  spent: number
  remaining: number
  percentage: number
  is_over: boolean
}

interface DashboardShellProps {
  accounts: Account[]
  transactions: Transaction[]
  budgets: Budget[]
  budgetProgress: BudgetProgressLite[]
  baseCurrency: string
  /** Pre-converted net worth in baseCurrency, computed server-side. */
  netWorth: number
}

const CATEGORY_DEFAULT_COLORS: Record<string, string> = {
  Food: '#f87171', Housing: '#60a5fa', Utilities: '#fbbf24', Salary: '#34d399',
  Transport: '#a78bfa', Entertainment: '#f472b6', Shopping: '#fb7185',
  Healthcare: '#2dd4bf', Investment: '#38bdf8', Uncategorized: '#9ca3af',
}

const RANGES = [
  { id: '30d', label: '30 Days', days: 30 },
  { id: '90d', label: '90 Days', days: 90 },
  { id: 'month', label: 'This Month', days: 0 },
  { id: 'all', label: 'All Time', days: -1 },
] as const

type RangeId = typeof RANGES[number]['id'] | 'custom'

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function DashboardShell({
  accounts,
  transactions,
  budgets,
  budgetProgress,
  baseCurrency,
  netWorth,
}: DashboardShellProps) {
  const { format, convert } = useCurrency()
  const privacyMode = usePrivacyMode()
  const [range, setRange] = useState<RangeId>('30d')
  const [customRange, setCustomRange] = useState<CustomRange | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  const resetPage = useCallback(() => setPage(1), [])

  const dateLimit = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (range === 'custom' && customRange) {
      const start = new Date(customRange.start)
      start.setHours(0, 0, 0, 0)
      const end = new Date(customRange.end)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    const cfg = RANGES.find(r => r.id === range) ?? RANGES[0]
    if (cfg.id === 'month') return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today }
    if (cfg.id === 'all') return { start: new Date(1970, 0, 1), end: today }
    const start = new Date()
    start.setDate(today.getDate() - cfg.days)
    start.setHours(0, 0, 0, 0)
    return { start, end: today }
  }, [range, customRange])

  function handleCustomRangeChange(next: CustomRange | null) {
    setCustomRange(next)
    setRange(next ? 'custom' : '30d')
    resetPage()
  }

  const filteredTxs = useMemo(() => {
    return transactions.filter(tx => {
      const d = new Date(tx.date || tx.created_at)
      return d >= dateLimit.start && d <= dateLimit.end
    })
  }, [transactions, dateLimit])

  const totals = useMemo(() => {
    let income = 0, expense = 0
    filteredTxs.forEach(tx => {
      if (tx.transfer_id) return
      if (tx.type === 'income') income += tx.base_currency_amount || 0
      else if (tx.type === 'expense') expense += tx.base_currency_amount || 0
    })
    const net = income - expense
    return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0 }
  }, [filteredTxs])

  const netWorthTrend = useMemo(() => {
    const now = new Date()
    const buckets: Record<string, { label: string; year: number; month: number; net: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), net: 0 }
    }
    transactions.forEach(tx => {
      if (tx.transfer_id) return
      const d = new Date(tx.date || tx.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!buckets[key]) return
      if (tx.type === 'income') buckets[key].net += tx.base_currency_amount || 0
      else if (tx.type === 'expense') buckets[key].net -= tx.base_currency_amount || 0
    })
    let running = netWorth
    const ordered = Object.values(buckets).sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
    const reversed = [...ordered].reverse().map(b => {
      const point = { name: `${b.label}`, value: running }
      running -= b.net
      return point
    })
    return reversed.reverse()
  }, [transactions, netWorth])

  const monthChangePct = useMemo(() => {
    if (netWorthTrend.length < 2) return null
    const first = netWorthTrend[0].value
    const last = netWorthTrend[netWorthTrend.length - 1].value
    if (first === 0) return null
    return ((last - first) / Math.abs(first)) * 100
  }, [netWorthTrend])

  const categorySpending = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {}
    filteredTxs.forEach(tx => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const name = tx.categories?.name || 'Uncategorized'
      const color = tx.categories?.color || CATEGORY_DEFAULT_COLORS[name] || '#6b7280'
      if (!map[name]) map[name] = { name, value: 0, color }
      map[name].value += tx.base_currency_amount || 0
    })
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [filteredTxs])

  const cashflowTrend = useMemo(() => {
    const now = new Date()
    const buckets: Record<string, { label: string; year: number; month: number; income: number; expense: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 }
    }
    transactions.forEach(tx => {
      if (tx.transfer_id) return
      const d = new Date(tx.date || tx.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!buckets[key]) return
      if (tx.type === 'income') buckets[key].income += tx.base_currency_amount || 0
      else if (tx.type === 'expense') buckets[key].expense += tx.base_currency_amount || 0
    })
    return Object.values(buckets)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(g => ({ name: g.label, Income: g.income, Expense: g.expense }))
  }, [transactions])

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return filteredTxs
    const q = searchQuery.toLowerCase()
    return filteredTxs.filter(tx =>
      (tx.description || '').toLowerCase().includes(q) ||
      (tx.categories?.name || '').toLowerCase().includes(q) ||
      (tx.accounts?.name || '').toLowerCase().includes(q)
    )
  }, [filteredTxs, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredBySearch.length / PAGE_SIZE))
  const displayPage = Math.min(page, totalPages)
  const paginatedTxs = useMemo(() => {
    const start = (displayPage - 1) * PAGE_SIZE
    return filteredBySearch.slice(start, start + PAGE_SIZE)
  }, [filteredBySearch, displayPage])

  const budgetsWithProgress = useMemo(() => {
    return budgets.map(b => {
      const p = budgetProgress.find(bp => bp.budget_id === b.id)
      return { ...b, spent: p?.spent ?? 0, remaining: p?.remaining ?? b.amount, percentage: p?.percentage ?? 0, isOver: p?.is_over ?? false }
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 4)
  }, [budgets, budgetProgress])

  const rangeDayCount = Math.max(
    1,
    Math.round((dateLimit.end.getTime() - dateLimit.start.getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">

      <QuickActionsBar />

      <NetWorthHero
        netWorth={netWorth}
        baseCurrency={baseCurrency}
        accountCount={accounts.length}
        trend={netWorthTrend}
        monthChangePct={monthChangePct}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-foreground">Activity overview</h2>
          {range === 'custom' && customRange && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {rangeDayCount} day{rangeDayCount !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="flex bg-muted p-1 rounded-xl border border-border/40 overflow-x-auto"
            role="radiogroup"
            aria-label="Time range"
          >
            {RANGES.map(r => (
              <button
                key={r.id}
                role="radio"
                aria-checked={range === r.id}
                onClick={() => { setRange(r.id); setCustomRange(null); resetPage() }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:ring-2 ${
                  range === r.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <DateRangePicker value={customRange} onChange={handleCustomRangeChange} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Net Worth" amount={netWorth} fromCurrency={baseCurrency} icon={<Wallet size={16} />} sub={`${accounts.length} acct${accounts.length !== 1 ? 's' : ''}`} />
        <KpiCard label="Income" amount={totals.income} fromCurrency={baseCurrency} icon={<TrendingUp size={16} className="text-income" />} sub="Selected range" accent="income" />
        <KpiCard label="Expenses" amount={totals.expense} fromCurrency={baseCurrency} icon={<TrendingDown size={16} className="text-expense" />} sub="Excludes transfers" accent="expense" />
        <KpiCard label="Net Savings" amount={totals.net} fromCurrency={baseCurrency} icon={<PiggyBank size={16} className="text-primary" />} sub={`${Math.round(totals.savingsRate)}% rate`} accent={totals.net >= 0 ? 'income' : 'expense'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 flex flex-col gap-6">

          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Cashflow (6 months)</h3>
              <p className="text-[11px] text-muted-foreground">Income vs. expenses by month</p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
                    tickFormatter={v => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11 }}
                    formatter={(value) => [privacyMode ? '******' : format(convert(Number(value ?? 0), baseCurrency)), '']}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#34d399" strokeWidth={2} fill="url(#dashIncomeGrad)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f87171" strokeWidth={2} fill="url(#dashExpenseGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Transactions</h3>
                <p className="text-[11px] text-muted-foreground">{filteredBySearch.length} match current range</p>
              </div>
              <div className="relative w-full md:w-56">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <label htmlFor="dash-search" className="sr-only">Search transactions</label>
                <input
                  id="dash-search"
                  type="search"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); resetPage() }}
                  placeholder="Search…"
                  className="w-full bg-muted border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {paginatedTxs.length === 0 ? (
              <div className="py-10 text-center bg-muted/10 border border-dashed border-border rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">
                  {searchQuery.trim() ? 'No transactions match your search.' : 'No transactions in this range.'}
                </p>
                {searchQuery.trim() && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-primary font-semibold mt-2 underline focus-visible:ring-2 rounded"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTxs.map(tx => {
                  const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
                  const isTransfer = tx.type === 'transfer'
                  const color = tx.categories?.color || CATEGORY_DEFAULT_COLORS[tx.categories?.name || ''] || '#3b82f6'
                  const convertedAmount = convert(tx.amount, tx.currency)
                  return (
                    <Link
                      href={`/transactions/${tx.id}`}
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-card/40 border border-border/30 rounded-xl hover:bg-muted/20 transition focus-visible:ring-2"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0"
                          style={{ backgroundColor: `${color}15`, color }}
                          aria-hidden="true"
                        >
                          {isTransfer ? '⇄' : renderCategoryIcon(tx.categories?.icon, tx.categories?.name ?? 'U', 'w-4 h-4')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {tx.description || tx.categories?.name || 'Transaction'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {tx.accounts?.name || '—'} · {formatDateLabel(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p className={`text-xs font-bold tabular-nums shrink-0 ml-3 ${isIncome ? 'text-income' : isTransfer ? 'text-primary' : 'text-expense'}`}>
                        {isIncome ? '+' : '−'}{privacyMode ? '******' : format(tx.amount, tx.currency)}
                      </p>
                    </Link>
                  )
                })}

                {totalPages > 1 && (
                  <nav className="flex items-center justify-between pt-3 border-t border-border/40 text-xs" aria-label="Transaction pagination">
                    <span className="text-muted-foreground">Page {displayPage} of {totalPages}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage(c => Math.max(1, c - 1))}
                        disabled={displayPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold transition disabled:opacity-30 focus-visible:ring-2"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setPage(c => Math.min(totalPages, c + 1))}
                        disabled={displayPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold transition disabled:opacity-30 focus-visible:ring-2"
                      >
                        Next
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-6">
          <AccountsRail accounts={accounts} />

          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground">Spending mix</h3>
              {categorySpending.length > 4 && (
                <span className="text-[10px] text-muted-foreground">Top 6</span>
              )}
            </div>
            {categorySpending.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle size={20} className="text-muted-foreground mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">No expenses in this range.</p>
              </div>
            ) : (
              <>
                <div className="h-36 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categorySpending} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={3}>
                        {categorySpending.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [privacyMode ? '******' : format(convert(Number(value ?? 0), baseCurrency)), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Total</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">
                      {privacyMode ? '******' : format(convert(categorySpending.reduce((s, c) => s + c.value, 0), baseCurrency))}
                    </span>
                  </div>
                </div>
                <ul className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-1">
                  {categorySpending.map(item => (
                    <li key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-md shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                        <span className="font-semibold text-foreground truncate">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground font-mono shrink-0 ml-2">{privacyMode ? '******' : format(convert(item.value, baseCurrency))}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Budgets</h3>
              <Link href="/budgets" className="text-[11px] font-bold text-primary hover:underline focus-visible:ring-2 rounded">All</Link>
            </div>
            {budgetsWithProgress.length === 0 ? (
              <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border">
                <p className="text-xs text-muted-foreground">No active budgets.</p>
                <Link href="/budgets/new" className="text-[11px] text-primary underline mt-1.5 inline-block font-semibold focus-visible:ring-2 rounded">
                  Create a budget
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {budgetsWithProgress.map(b => (
                  <Link key={b.id} href={`/budgets/${b.id}`} className="block space-y-1.5 focus-visible:ring-2 rounded-lg p-1 -m-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground truncate">{b.name}</span>
                      <span className="text-muted-foreground font-medium shrink-0 ml-2">
                        <span className={b.isOver ? 'text-expense' : 'text-foreground'}>{privacyMode ? '******' : format(b.spent, b.currency)}</span>
                        {' / '}{privacyMode ? '******' : format(b.amount, b.currency)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(b.percentage)} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={`h-full rounded-full transition-all ${b.isOver ? 'bg-expense' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}