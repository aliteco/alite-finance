// filepath: alite/src/components/interactive-dashboard.tsx
'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Search,
  ChevronRight,
  PiggyBank,
  ListFilter,
  AlertCircle,
  Activity,
  Coins,
  Scale,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

// ─── Types & Interfaces ───────────────────────────────────────────────────────

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
  start_date: string
  end_date: string | null
  is_active: boolean
  category_id: string | null
  categories: Category | null
}

interface InteractiveDashboardProps {
  initialAccounts: Account[]
  initialTransactions: Transaction[]
  initialBudgets: Budget[]
  baseCurrency: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const CATEGORY_DEFAULT_COLORS: Record<string, string> = {
  Food: '#f87171',
  Housing: '#60a5fa',
  Utilities: '#fbbf24',
  Salary: '#34d399',
  Transport: '#a78bfa',
  Entertainment: '#f472b6',
  Shopping: '#fb7185',
  Healthcare: '#2dd4bf',
  Investment: '#38bdf8',
  Uncategorized: '#9ca3af',
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank Account',
  savings: 'Savings Account',
  credit_card: 'Credit Card',
  investment: 'Investment',
  other: 'Other Type',
}

const TIMEFRAMES = [
  { id: 'this-month', label: 'This Month' },
  { id: '30-days', label: '30 Days' },
  { id: '90-days', label: 'Last 3 Months' },
  { id: 'ytd', label: 'Year to Date' },
  { id: 'all', label: 'All Time' },
] as const

export default function InteractiveDashboard({
  initialAccounts,
  initialTransactions,
  initialBudgets,
  baseCurrency,
}: InteractiveDashboardProps) {
  const [mounted, setMounted] = useState(false)
  const [currentViewMode, setCurrentViewMode] = useState<'overview' | 'analysis'>('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30-days')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedTxType, setSelectedTxType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [selectedPieMonth, setSelectedPieMonth] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 8

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedPieMonth('all')
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedTimeframe, selectedAccount])

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Reset to page 1 whenever filters change, so users never land on an
  // empty page after narrowing results (was a latent bug previously).
  const resetPage = useCallback(() => setCurrentPage(1), [])

  const dateLimit = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedTimeframe === 'this-month') {
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today }
    }
    if (selectedTimeframe === '30-days') {
      const start = new Date(); start.setDate(today.getDate() - 30); start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
    if (selectedTimeframe === '90-days') {
      const start = new Date(); start.setDate(today.getDate() - 90); start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
    if (selectedTimeframe === 'ytd') {
      return { start: new Date(today.getFullYear(), 0, 1), end: today }
    }
    return { start: new Date(1970, 0, 1), end: today }
  }, [selectedTimeframe])

  const filteredTxs = useMemo(() => {
    return initialTransactions.filter((tx) => {
      const txDate = new Date(tx.date || tx.created_at)
      if (txDate < dateLimit.start || txDate > dateLimit.end) return false
      if (selectedAccount !== 'all' && tx.accounts?.id !== selectedAccount) return false
      if (selectedTxType !== 'all' && tx.type !== selectedTxType) return false
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const descMatch = (tx.description || '').toLowerCase().includes(query)
        const catMatch = (tx.categories?.name || '').toLowerCase().includes(query)
        const acctMatch = (tx.accounts?.name || '').toLowerCase().includes(query)
        if (!descMatch && !catMatch && !acctMatch) return false
      }
      return true
    })
  }, [initialTransactions, dateLimit, selectedAccount, selectedTxType, searchQuery])

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>()
    filteredTxs.forEach(tx => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const date = new Date(tx.date || tx.created_at)
      monthsSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    })
    return Array.from(monthsSet).sort().reverse()
  }, [filteredTxs])

  const previousDateLimit = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedTimeframe === 'this-month') {
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999),
      }
    }
    if (selectedTimeframe === '30-days') {
      const start = new Date(); start.setDate(today.getDate() - 60); start.setHours(0, 0, 0, 0)
      const end = new Date(); end.setDate(today.getDate() - 31); end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (selectedTimeframe === '90-days') {
      const start = new Date(); start.setDate(today.getDate() - 180); start.setHours(0, 0, 0, 0)
      const end = new Date(); end.setDate(today.getDate() - 91); end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (selectedTimeframe === 'ytd') {
      return {
        start: new Date(today.getFullYear() - 1, 0, 1),
        end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
      }
    }
    return { start: new Date(1960, 0, 1), end: new Date(1970, 0, 1) }
  }, [selectedTimeframe])

  const previousFilteredTxs = useMemo(() => {
    return initialTransactions.filter((tx) => {
      const txDate = new Date(tx.date || tx.created_at)
      if (txDate < previousDateLimit.start || txDate > previousDateLimit.end) return false
      if (selectedAccount !== 'all' && tx.accounts?.id !== selectedAccount) return false
      return true
    })
  }, [initialTransactions, previousDateLimit, selectedAccount])

  const previousTotals = useMemo(() => {
    let income = 0, expense = 0
    previousFilteredTxs.forEach((tx) => {
      if (tx.transfer_id) return
      if (tx.type === 'income') income += tx.base_currency_amount || 0
      else if (tx.type === 'expense') expense += tx.base_currency_amount || 0
    })
    const net = income - expense
    return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0 }
  }, [previousFilteredTxs])

  const categoryComparison = useMemo(() => {
    const map: Record<string, { name: string; current: number; previous: number; color: string }> = {}
    filteredTxs.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const catId = tx.categories?.id || 'uncategorized'
      const catName = tx.categories?.name || 'Uncategorized'
      const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'
      if (!map[catId]) map[catId] = { name: catName, current: 0, previous: 0, color: catColor }
      map[catId].current += tx.base_currency_amount || 0
    })
    previousFilteredTxs.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const catId = tx.categories?.id || 'uncategorized'
      const catName = tx.categories?.name || 'Uncategorized'
      const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'
      if (!map[catId]) map[catId] = { name: catName, current: 0, previous: 0, color: catColor }
      map[catId].previous += tx.base_currency_amount || 0
    })
    return Object.values(map).map((item) => {
      const diff = item.current - item.previous
      const pctChange = item.previous > 0 ? (diff / item.previous) * 100 : 0
      return { ...item, diff, pctChange }
    }).sort((a, b) => b.current - a.current)
  }, [filteredTxs, previousFilteredTxs])

  const totals = useMemo(() => {
    let income = 0, expense = 0
    filteredTxs.forEach((tx) => {
      if (tx.transfer_id) return
      if (tx.type === 'income') income += tx.base_currency_amount || 0
      else if (tx.type === 'expense') expense += tx.base_currency_amount || 0
    })
    const net = income - expense
    return { income, expense, net, savingsRate: income > 0 ? (net / income) * 100 : 0 }
  }, [filteredTxs])

  const dynamicNetWorth = useMemo(() => {
    if (selectedAccount === 'all') {
      return initialAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    }
    return initialAccounts.filter(a => a.id === selectedAccount).reduce((sum, acc) => sum + (acc.balance || 0), 0)
  }, [initialAccounts, selectedAccount])

  const monthDivisor = useMemo(() => {
    if (selectedTimeframe === 'this-month' || selectedTimeframe === '30-days') return 1
    if (selectedTimeframe === '90-days') return 3
    if (selectedTimeframe === 'ytd') return Math.max(1, new Date().getMonth() + 1)
    return 12
  }, [selectedTimeframe])

  const averageMonthlyExpense = totals.expense / monthDivisor
  const averageMonthlyIncome = totals.income / monthDivisor

  const last12MonthsTrend = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1, 0, 0, 0, 0)
    const monthlyData: Record<string, { label: string; year: number; month: number; income: number; expense: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 }
    }
    initialTransactions.forEach((tx) => {
      if (tx.transfer_id) return
      const tDate = new Date(tx.date || tx.created_at)
      if (tDate >= startDate && tDate <= today) {
        const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyData[key]) {
          if (tx.type === 'income') monthlyData[key].income += tx.base_currency_amount || 0
          else if (tx.type === 'expense') monthlyData[key].expense += tx.base_currency_amount || 0
        }
      }
    })
    return Object.values(monthlyData)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(g => ({ name: `${g.label} ${String(g.year).slice(-2)}`, Income: g.income, Expense: g.expense, Savings: g.income - g.expense }))
  }, [initialTransactions])

  const last12MonthsTop5Categories = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1, 0, 0, 0, 0)
    const map: Record<string, { name: string; value: number; color: string }> = {}
    initialTransactions.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const tDate = new Date(tx.date || tx.created_at)
      if (tDate >= startDate && tDate <= today) {
        const catId = tx.categories?.id || 'uncategorized'
        const catName = tx.categories?.name || 'Uncategorized'
        const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'
        if (!map[catId]) map[catId] = { name: catName, value: 0, color: catColor }
        map[catId].value += tx.base_currency_amount || 0
      }
    })
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [initialTransactions])

  const categorySpending = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; count: number }> = {}
    filteredTxs.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      
      const tDate = new Date(tx.date || tx.created_at)
      const tMonth = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`
      if (selectedPieMonth !== 'all' && tMonth !== selectedPieMonth) return

      const catId = tx.categories?.id || 'uncategorized'
      const catName = tx.categories?.name || 'Uncategorized'
      const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'
      if (!map[catId]) map[catId] = { name: catName, value: 0, color: catColor, count: 0 }
      map[catId].value += tx.base_currency_amount || 0
      map[catId].count += 1
    })
    const result = Object.values(map).sort((a, b) => b.value - a.value)
    const totalExpenses = result.reduce((sum, item) => sum + item.value, 0)
    return result.map(item => ({ ...item, percentage: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0 }))
  }, [filteredTxs, selectedPieMonth])

  const topExpenses = useMemo(() => {
    return filteredTxs
      .filter((tx) => tx.type === 'expense' && !tx.transfer_id)
      .sort((a, b) => b.base_currency_amount - a.base_currency_amount)
      .slice(0, 5)
  }, [filteredTxs])

  const cashflowTrend = useMemo(() => {
    const now = new Date()
    const monthlyData: Record<string, { label: string; year: number; month: number; income: number; expense: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[key] = { label: date.toLocaleString('en-US', { month: 'short' }), year: date.getFullYear(), month: date.getMonth(), income: 0, expense: 0 }
    }
    initialTransactions.forEach((tx) => {
      if (tx.transfer_id) return
      const tDate = new Date(tx.date || tx.created_at)
      const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`
      if (monthlyData[key]) {
        if (tx.type === 'income') monthlyData[key].income += tx.base_currency_amount || 0
        else if (tx.type === 'expense') monthlyData[key].expense += tx.base_currency_amount || 0
      }
    })
    return Object.values(monthlyData)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(g => ({ name: `${g.label} ${String(g.year).slice(-2)}`, Income: g.income, Expense: g.expense, Savings: g.income - g.expense }))
  }, [initialTransactions])

  const activeBudgets = useMemo(() => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    return initialBudgets.map((budget) => {
      const currentMonthSpend = initialTransactions
        .filter((tx) => {
          if (tx.type !== 'expense' || tx.transfer_id) return false
          if (budget.category_id && tx.categories?.id !== budget.category_id) return false
          const txDate = new Date(tx.date || tx.created_at)
          return txDate >= monthStart && txDate <= monthEnd
        })
        .reduce((sum, tx) => sum + (tx.base_currency_amount || 0), 0)

      const remaining = budget.amount - currentMonthSpend
      const pct = budget.amount > 0 ? (currentMonthSpend / budget.amount) * 100 : 0

      return { ...budget, spent: currentMonthSpend, remaining, percentage: Math.min(100, pct), actualPct: pct }
    })
  }, [initialBudgets, initialTransactions])

  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / itemsPerPage))
  const displayPage = Math.min(currentPage, totalPages)
  const paginatedTxs = useMemo(() => {
    const start = (displayPage - 1) * itemsPerPage
    return filteredTxs.slice(start, start + itemsPerPage)
  }, [filteredTxs, displayPage])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            All figures shown in <span className="font-semibold text-primary">{baseCurrency}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-muted p-1 rounded-xl border border-border/40" role="radiogroup" aria-label="Dashboard view mode">
            <button
              role="radio"
              aria-checked={currentViewMode === 'overview'}
              onClick={() => setCurrentViewMode('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:ring-2 ${
                currentViewMode === 'overview' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              role="radio"
              aria-checked={currentViewMode === 'analysis'}
              onClick={() => setCurrentViewMode('analysis')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus-visible:ring-2 ${
                currentViewMode === 'analysis' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Analysis
            </button>
          </div>

          <div className="flex bg-muted p-1 rounded-xl border border-border/40 overflow-x-auto" role="radiogroup" aria-label="Timeframe">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={selectedTimeframe === t.id}
                onClick={() => { setSelectedTimeframe(t.id); resetPage() }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:ring-2 ${
                  selectedTimeframe === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <label htmlFor="dashboard-account-filter" className="sr-only">Filter by account</label>
            <select
              id="dashboard-account-filter"
              value={selectedAccount}
              onChange={(e) => { setSelectedAccount(e.target.value); resetPage() }}
              className="appearance-none bg-card border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="all">All Accounts</option>
              {initialAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground" aria-hidden="true">
              <ListFilter size={13} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        <div className="lg:col-span-8 flex flex-col gap-6">

          {currentViewMode === 'analysis' ? (
            <div className="space-y-6">
              <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Scale size={15} className="text-primary" /> Period Comparison
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Versus {formatDateLabel(previousDateLimit.start.toISOString())} – {formatDateLabel(previousDateLimit.end.toISOString())}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ComparisonCard
                    label="Income"
                    current={totals.income}
                    previous={previousTotals.income}
                    baseCurrency={baseCurrency}
                    positiveIsGood
                  />
                  <ComparisonCard
                    label="Expenses"
                    current={totals.expense}
                    previous={previousTotals.expense}
                    baseCurrency={baseCurrency}
                    positiveIsGood={false}
                  />
                  <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Savings</span>
                    <div className="flex items-baseline justify-between">
                      <p className={`text-lg font-extrabold tabular-nums ${totals.net >= 0 ? 'text-foreground' : 'text-expense'}`}>
                        {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net, baseCurrency)}
                      </p>
                      <span className="text-[11px] text-muted-foreground opacity-70">
                        Prev: {previousTotals.net >= 0 ? '+' : ''}{formatCurrency(previousTotals.net, baseCurrency)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Savings Rate</span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-extrabold text-foreground tabular-nums">{Math.round(totals.savingsRate)}%</p>
                      <span className="text-[11px] text-muted-foreground opacity-70">Prev: {Math.round(previousTotals.savingsRate)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Activity size={15} className="text-primary" /> 12-Month Trend
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Monthly income vs. expenses</p>
                  </div>
                  <div className="h-64 w-full">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={last12MonthsTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false}
                            tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                          <Tooltip
                            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px' }}
                            formatter={(value) => [formatCurrency(Number(value ?? 0), baseCurrency), '']}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                          <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Coins size={15} className="text-primary" /> Top 5 Categories (12M)
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Largest spend over the past year</p>
                  </div>
                  {last12MonthsTop5Categories.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-center">
                      <p className="text-xs text-muted-foreground">No expenses recorded yet.</p>
                    </div>
                  ) : (
                    <div className="h-64 grid grid-cols-1 md:grid-cols-12 items-center gap-2">
                      <div className="md:col-span-7 h-full relative flex items-center justify-center">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={last12MonthsTop5Categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                                {last12MonthsTop5Categories.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px' }}
                                formatter={(value) => [formatCurrency(Number(value ?? 0), baseCurrency), '']}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</span>
                          <span className="text-xs font-extrabold text-foreground">
                            {formatCurrency(last12MonthsTop5Categories.reduce((sum, c) => sum + c.value, 0), baseCurrency)}
                          </span>
                        </div>
                      </div>
                      <div className="md:col-span-5 flex flex-col gap-2 max-h-full overflow-y-auto">
                        {last12MonthsTop5Categories.map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                              <span className="text-[11px] font-bold text-foreground truncate">{cat.name}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
                              {formatCurrency(cat.value, baseCurrency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Category Spending Variance</h3>
                  <p className="text-[11px] text-muted-foreground">Current vs. previous period</p>
                </div>
                {categoryComparison.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No spending records in this period.</p>
                ) : (
                  <div className="border border-border/30 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 text-[10px] font-bold uppercase text-muted-foreground">
                      <div className="col-span-4">Category</div>
                      <div className="col-span-3 text-right">Current</div>
                      <div className="col-span-3 text-right">Previous</div>
                      <div className="col-span-2 text-right">Change</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/15">
                      {categoryComparison.map((cat) => {
                        const isIncrease = cat.diff > 0
                        return (
                          <div key={cat.name} className="grid grid-cols-12 gap-2 p-3 text-xs items-center hover:bg-muted/10 transition">
                            <div className="col-span-4 flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                              <span className="font-bold text-foreground truncate">{cat.name}</span>
                            </div>
                            <div className="col-span-3 text-right tabular-nums font-semibold text-foreground">
                              {formatCurrency(cat.current, baseCurrency)}
                            </div>
                            <div className="col-span-3 text-right tabular-nums text-muted-foreground">
                              {formatCurrency(cat.previous, baseCurrency)}
                            </div>
                            <div className="col-span-2 text-right tabular-nums font-bold">
                              <span className={isIncrease ? 'text-expense' : 'text-income'}>
                                {isIncrease ? '+' : ''}{cat.pctChange.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <BurnRateSimulator
                dynamicNetWorth={dynamicNetWorth}
                averageMonthlyExpense={averageMonthlyExpense}
                averageMonthlyIncome={averageMonthlyIncome}
                baseCurrency={baseCurrency}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Net Worth" value={formatCurrency(dynamicNetWorth, baseCurrency)} icon={<Wallet className="w-4 h-4" />} sub={`${initialAccounts.length} account${initialAccounts.length !== 1 ? 's' : ''}`} />
                <KpiCard label="Income" value={`+${formatCurrency(totals.income, baseCurrency)}`} icon={<TrendingUp className="w-4 h-4 text-income" />} sub="Selected range" accent="income" />
                <KpiCard label="Expenses" value={`−${formatCurrency(totals.expense, baseCurrency)}`} icon={<TrendingDown className="w-4 h-4 text-expense" />} sub="Excludes transfers" accent="expense" />
                <KpiCard
                  label="Net Savings"
                  value={`${totals.net >= 0 ? '+' : ''}${formatCurrency(totals.net, baseCurrency)}`}
                  icon={<PiggyBank className="w-4 h-4 text-primary" />}
                  sub={`${Math.round(totals.savingsRate)}% savings rate`}
                  accent={totals.net >= 0 ? 'income' : 'expense'}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Activity size={14} className="text-primary" /> Cashflow Trend
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Last 6 months</p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-semibold">
                      <span className="flex items-center gap-1 text-income"><span className="w-2 h-2 rounded-full bg-income" aria-hidden="true" /> Income</span>
                      <span className="flex items-center gap-1 text-expense"><span className="w-2 h-2 rounded-full bg-expense" aria-hidden="true" /> Expense</span>
                    </div>
                  </div>

                  <div className="h-56 md:h-64 w-full">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashflowTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#34d399" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f87171" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }}
                            tickFormatter={(v) => formatCurrency(v, baseCurrency).replace(/[^\d.k]/gi, '')} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--foreground)' }}
                            formatter={(value) => [
                              formatCurrency(Number(value ?? 0), baseCurrency),
                              '',
                            ]}
                          />
                          <Area type="monotone" dataKey="Income" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                          <Area type="monotone" dataKey="Expense" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center" aria-hidden="true">
                        <p className="text-xs text-muted-foreground">Loading chart…</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-5 bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Expense Breakdown</h3>
                      <p className="text-[11px] text-muted-foreground">Selected range</p>
                    </div>

                    {availableMonths.length > 1 && (
                      <div>
                        <label htmlFor="pie-month-select" className="sr-only">Select Month</label>
                        <select
                          id="pie-month-select"
                          value={selectedPieMonth}
                          onChange={(e) => setSelectedPieMonth(e.target.value)}
                          className="bg-muted border border-border rounded-xl px-2.5 py-1 text-[10px] font-semibold text-foreground focus:outline-none"
                        >
                          <option value="all">All Months</option>
                          {availableMonths.map(m => {
                            const [yr, mo] = m.split('-')
                            const date = new Date(parseInt(yr), parseInt(mo) - 1, 1)
                            const label = date.toLocaleString('en-US', { month: 'short', year: '2-digit' })
                            return (
                              <option key={m} value={m}>{label}</option>
                            )
                          })}
                        </select>
                      </div>
                    )}
                  </div>

                  {categorySpending.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                      <AlertCircle size={24} className="text-muted-foreground mb-2" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">No expenses in this range.</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="h-44 w-full relative">
                        {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={categorySpending} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3}>
                                {categorySpending.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    style={{ opacity: hoveredCategory === null || hoveredCategory === entry.name ? 1 : 0.45, transition: 'opacity 0.2s ease-in-out' }}
                                  />
                                ))}
                              </Pie>
                              <Tooltip 
                              formatter={(value) => [
                                formatCurrency(Number(value ?? 0), baseCurrency),
                                '',
                              ]}
                              contentStyle={{ borderRadius: '10px' }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">
                            {formatCurrency(categorySpending.reduce((s, c) => s + c.value, 0), baseCurrency)}
                          </span>
                        </div>
                      </div>

                      <ul className="flex flex-col gap-1 mt-2 max-h-[110px] overflow-y-auto pr-1">
                        {categorySpending.map((item) => (
                          <li
                            key={item.name}
                            className="flex items-center justify-between text-xs p-1 rounded-lg hover:bg-muted/30 transition cursor-default"
                            onMouseEnter={() => setHoveredCategory(item.name)}
                            onMouseLeave={() => setHoveredCategory(null)}
                          >
                            <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-md" style={{ backgroundColor: item.color }} aria-hidden="true" />
                              <span className="font-semibold text-foreground truncate">{item.name}</span>
                            </div>
                            <span className="text-muted-foreground font-mono">{Math.round(item.percentage)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border/70 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Transactions</h3>
                    <p className="text-[11px] text-muted-foreground">{filteredTxs.length} match current filters</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 md:w-48">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <label htmlFor="dashboard-tx-search" className="sr-only">Search transactions</label>
                      <input
                        id="dashboard-tx-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); resetPage() }}
                        placeholder="Search…"
                        className="w-full bg-muted border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <label htmlFor="dashboard-tx-type" className="sr-only">Filter by type</label>
                    <select
                      id="dashboard-tx-type"
                      value={selectedTxType}
                      onChange={(e) => { setSelectedTxType(e.target.value); resetPage() }}
                      className="bg-muted border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="expense">Expenses</option>
                      <option value="income">Income</option>
                      <option value="transfer">Transfers</option>
                    </select>
                  </div>
                </div>

                {filteredTxs.length === 0 ? (
                  <div className="py-12 text-center bg-muted/10 border border-dashed border-border rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium">No transactions match your filters.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedTxType('all'); setSelectedAccount('all'); resetPage() }}
                      className="text-xs text-primary font-semibold mt-2 underline focus-visible:ring-2 rounded"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedTxs.map((tx) => {
                      const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
                      const isTransfer = tx.type === 'transfer'
                      const color = tx.categories?.color || CATEGORY_DEFAULT_COLORS[tx.categories?.name || ''] || '#3b82f6'

                      return (
                        <Link
                          href={`/transactions/${tx.id}`}
                          key={tx.id}
                          className="flex items-center justify-between p-3 md:p-3.5 bg-card/40 border border-border/30 rounded-xl hover:bg-muted/20 transition focus-visible:ring-2"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0"
                              style={{ backgroundColor: `${color}15`, color }}
                              aria-hidden="true"
                            >
                              {isTransfer ? '⇄' : (tx.categories?.name || 'U').charAt(0).toUpperCase()}
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

                          <div className="text-right shrink-0 ml-3">
                            <p className={`text-xs font-bold tabular-nums ${isIncome ? 'text-income' : isTransfer ? 'text-primary' : 'text-expense'}`}>
                              {isIncome ? '+' : '−'}{formatCurrency(tx.amount, tx.currency)}
                            </p>
                            {tx.currency !== baseCurrency && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                                {formatCurrency(tx.base_currency_amount, baseCurrency)}
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}

                    {totalPages > 1 && (
                      <nav className="flex items-center justify-between pt-4 border-t border-border/40 text-xs" aria-label="Transaction pagination">
                        <span className="text-muted-foreground">Page {displayPage} of {totalPages}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                            disabled={displayPage === 1}
                            className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-semibold transition disabled:opacity-30 focus-visible:ring-2"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
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
            </>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-card border border-border/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accounts</h3>
              <Link href="/accounts" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 focus-visible:ring-2 rounded">
                Manage <ChevronRight size={12} aria-hidden="true" />
              </Link>
            </div>

            {initialAccounts.length === 0 ? (
              <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border">
                <p className="text-xs text-muted-foreground mb-2">No accounts yet.</p>
                <Link href="/accounts/new" className="text-[11px] text-primary underline font-semibold focus-visible:ring-2 rounded">
                  Add your first account
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {initialAccounts.map((account) => (
                  <Link
                    key={account.id}
                    href={`/accounts/${account.id}`}
                    className={`flex items-center justify-between p-3 border rounded-xl hover:bg-muted/10 transition group focus-visible:ring-2 ${
                      selectedAccount === account.id ? 'border-primary/55 bg-primary/5' : 'border-border/30 bg-card/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold"
                        style={{ backgroundColor: account.color ? `${account.color}15` : 'var(--muted)', color: account.color || 'var(--foreground)' }}
                        aria-hidden="true"
                      >
                        {account.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{account.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{ACCOUNT_TYPE_LABELS[account.type] || account.type}</p>
                      </div>
                    </div>
                    <p className={`text-xs font-bold tabular-nums ${account.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Expenses</h3>
              <p className="text-[10px] text-muted-foreground">Largest in this range</p>
            </div>

            {topExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No records found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topExpenses.map((tx) => {
                  const color = tx.categories?.color || CATEGORY_DEFAULT_COLORS[tx.categories?.name || ''] || '#ef4444'
                  return (
                    <Link
                      key={tx.id}
                      href={`/transactions/${tx.id}`}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card/20 hover:bg-muted/10 transition focus-visible:ring-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ backgroundColor: `${color}15`, color }}
                          aria-hidden="true"
                        >
                          {tx.categories?.name ? tx.categories.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{tx.description || tx.categories?.name || 'Expense'}</p>
                          <p className="text-[9px] text-muted-foreground truncate">{tx.accounts?.name || '—'} • {formatDateLabel(tx.date)}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-expense shrink-0 pl-1.5 tabular-nums">
                        −{formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Budgets</h3>
                <p className="text-[10px] text-muted-foreground">This month</p>
              </div>
              <Link href="/budgets" className="text-[11px] font-bold text-primary hover:underline focus-visible:ring-2 rounded">
                All
              </Link>
            </div>

            {activeBudgets.length === 0 ? (
              <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border">
                <p className="text-xs text-muted-foreground">No active budgets.</p>
                <Link href="/budgets/new" className="text-[11px] text-primary underline mt-1.5 inline-block font-semibold focus-visible:ring-2 rounded">
                  Create a budget
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBudgets.map((budget) => {
                  const isOver = budget.spent > budget.amount
                  const color = budget.categories?.color || CATEGORY_DEFAULT_COLORS[budget.categories?.name || ''] || '#fbbf24'
                  return (
                    <Link key={budget.id} href="/budgets" className="block space-y-2 focus-visible:ring-2 rounded-lg p-1 -m-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5 shrink-0 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                          <span className="truncate">{budget.name}</span>
                        </span>
                        <div className="font-semibold text-right tabular-nums shrink-0 ml-2">
                          <span className={isOver ? 'text-expense' : 'text-foreground'}>{formatCurrency(budget.spent, budget.currency)}</span>
                          <span className="text-muted-foreground font-normal"> / {formatCurrency(budget.amount, budget.currency)}</span>
                        </div>
                      </div>

                      <div
                        className="h-2 bg-muted rounded-full overflow-hidden relative"
                        role="progressbar"
                        aria-valuenow={Math.round(budget.percentage)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${budget.name} budget used`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-expense' : 'bg-primary'}`}
                          style={{ width: `${budget.percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>{isOver ? 'Over budget' : `${Math.round(budget.percentage)}% used`}</span>
                        <span className={`font-semibold ${isOver ? 'text-expense' : 'text-income'}`}>
                          {isOver
                            ? `${formatCurrency(Math.abs(budget.remaining), budget.currency)} over`
                            : `${formatCurrency(budget.remaining, budget.currency)} left`}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  sub,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  sub: string
  accent?: 'income' | 'expense'
}) {
  const valueColor = accent === 'income' ? 'text-income' : accent === 'expense' ? 'text-expense' : 'text-foreground'
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-colors">
      <div className="flex items-center justify-between text-muted-foreground mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div>
        <p className={`text-lg md:text-2xl font-bold tracking-tight tabular-nums ${valueColor}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>
      </div>
    </div>
  )
}

function ComparisonCard({
  label,
  current,
  previous,
  baseCurrency,
  positiveIsGood,
}: {
  label: string
  current: number
  previous: number
  baseCurrency: string
  positiveIsGood: boolean
}) {
  const diff = current - previous
  const pct = previous > 0 ? (diff / previous) * 100 : 0
  const isUp = diff >= 0
  const isGood = positiveIsGood ? isUp : !isUp
  const color = isGood ? 'text-income' : 'text-expense'
  const valueColor = label === 'Income' ? 'text-income' : 'text-expense'

  return (
    <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">{label}</span>
      <div className="flex items-baseline justify-between">
        <p className={`text-lg font-extrabold tabular-nums ${valueColor}`}>{formatCurrency(current, baseCurrency)}</p>
        <span className="text-[11px] text-muted-foreground opacity-70">Prev: {formatCurrency(previous, baseCurrency)}</span>
      </div>
      <div className={`text-[11px] font-bold flex items-center gap-1 ${color}`}>
        {isUp ? <TrendingUp size={12} aria-hidden="true" /> : <TrendingDown size={12} aria-hidden="true" />}
        <span>{isUp ? 'Up' : 'Down'} {Math.abs(pct).toFixed(1)}% vs. prior period</span>
      </div>
    </div>
  )
}

function BurnRateSimulator({
  dynamicNetWorth,
  averageMonthlyExpense,
  averageMonthlyIncome,
  baseCurrency,
}: {
  dynamicNetWorth: number
  averageMonthlyExpense: number
  averageMonthlyIncome: number
  baseCurrency: string
}) {
  const [incomeChange, setIncomeChange] = useState(0)
  const [expenseChange, setExpenseChange] = useState(0)

  const simIncome = averageMonthlyIncome * (1 + incomeChange / 100)
  const simExpense = averageMonthlyExpense * (1 + expenseChange / 100)
  const surplus = simIncome - simExpense
  const isDepleting = surplus < 0
  const runwayMonths = isDepleting && simExpense > 0 ? dynamicNetWorth / Math.abs(surplus) : Infinity

  let diagnosis = { title: '', desc: '', bg: '', text: '' }
  if (!isDepleting) {
    diagnosis = {
      title: 'Sustainable',
      desc: 'Simulated income covers expenses — your reserves would grow under these conditions.',
      bg: 'bg-income/10 border-income/30',
      text: 'text-income',
    }
  } else if (runwayMonths < 3) {
    diagnosis = {
      title: 'Critical',
      desc: `Reserves would deplete in ${runwayMonths.toFixed(1)} months at this burn rate.`,
      bg: 'bg-expense/10 border-expense/30',
      text: 'text-expense',
    }
  } else if (runwayMonths < 6) {
    diagnosis = {
      title: 'Limited buffer',
      desc: `Reserves would last about ${runwayMonths.toFixed(1)} months.`,
      bg: 'bg-orange-500/10 border-orange-500/30',
      text: 'text-orange-500',
    }
  } else if (runwayMonths < 12) {
    diagnosis = {
      title: 'Comfortable',
      desc: `Reserves would last roughly ${runwayMonths.toFixed(1)} months.`,
      bg: 'bg-primary/10 border-primary/30',
      text: 'text-primary',
    }
  } else {
    diagnosis = {
      title: 'Strong runway',
      desc: `Reserves would last ${runwayMonths > 60 ? '60+' : runwayMonths.toFixed(1)} months.`,
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-500',
    }
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Sparkles size={14} className="text-primary" /> Runway Simulator
        </h3>
        <p className="text-[11px] text-muted-foreground">Estimate how long your reserves would last under different scenarios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Net Worth</span>
          <p className="text-base font-extrabold text-foreground tabular-nums">{formatCurrency(dynamicNetWorth, baseCurrency)}</p>
        </div>
        <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Simulated Expense</span>
          <p className="text-base font-extrabold text-expense tabular-nums">-{formatCurrency(simExpense, baseCurrency)}/mo</p>
        </div>
        <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Simulated Income</span>
          <p className="text-base font-extrabold text-income tabular-nums">+{formatCurrency(simIncome, baseCurrency)}/mo</p>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="income-slider" className="font-bold text-foreground">
              Income change: <span className="text-income">{incomeChange >= 0 ? '+' : ''}{incomeChange}%</span>
            </label>
            <button onClick={() => setIncomeChange(0)} className="text-[10px] text-primary hover:underline font-semibold focus-visible:ring-2 rounded">Reset</button>
          </div>
          <input id="income-slider" type="range" min="-50" max="100" step="5" value={incomeChange}
            onChange={(e) => setIncomeChange(Number(e.target.value))} className="w-full accent-primary cursor-pointer h-1 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="expense-slider" className="font-bold text-foreground">
              Expense change: <span className="text-expense">{expenseChange >= 0 ? '+' : ''}{expenseChange}%</span>
            </label>
            <button onClick={() => setExpenseChange(0)} className="text-[10px] text-primary hover:underline font-semibold focus-visible:ring-2 rounded">Reset</button>
          </div>
          <input id="expense-slider" type="range" min="-50" max="100" step="5" value={expenseChange}
            onChange={(e) => setExpenseChange(Number(e.target.value))} className="w-full accent-primary cursor-pointer h-1 rounded-lg" />
        </div>
      </div>

      <div className={`p-4 border rounded-xl space-y-1.5 ${diagnosis.bg}`} role="status">
        <span className={`text-xs font-bold uppercase tracking-wider ${diagnosis.text}`}>{diagnosis.title}</span>
        <p className="text-xs text-foreground/80 font-medium">{diagnosis.desc}</p>
      </div>
    </div>
  )
}

void motion