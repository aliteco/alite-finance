'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
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
  Plus,
  Coins,
  Scale,
  ArrowUpDown,
  Shuffle,
  Zap,
  Sparkles,
  ChevronUp,
  Calculator,
  Share2,
  Code,
  Info,
  RefreshCw,
  X
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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
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

export default function InteractiveDashboard({
  initialAccounts,
  initialTransactions,
  initialBudgets,
  baseCurrency,
}: InteractiveDashboardProps) {
  const [mounted, setMounted] = useState(false)

  // ── State variables ──
  const [currentViewMode, setCurrentViewMode] = useState<'overview' | 'analysis'>('overview')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30-days')
  const [selectedAccount, setSelectedAccount] = useState<string>('all')
  const [selectedTxType, setSelectedTxType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  
  // Simulation modifiers
  const [simulatedIncomeChange, setSimulatedIncomeChange] = useState<number>(0)
  const [simulatedExpenseChange, setSimulatedExpenseChange] = useState<number>(0)

  // FAB / FX Helper states
  const [fxPanelOpen, setFxPanelOpen] = useState<boolean>(false)
  const [fxCalculatorAmount, setFxCalculatorAmount] = useState<string>('100')
  const [fxCalculatorSource, setFxCalculatorSource] = useState<string>('USD')
  const [fxSimulatorUSD, setFxSimulatorUSD] = useState<number>(15000)
  const [fxSimulatorSGD, setFxSimulatorSGD] = useState<number>(11000)
  const [fxSimulatorEUR, setFxSimulatorEUR] = useState<number>(16000)

  // Pagination for transactions box
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 8

  // Hydration safety
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMounted(true)
  }, [])

  // ── Calculation of date limits based on timeframe ──
  const dateLimit = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedTimeframe === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start, end: today }
    }
    if (selectedTimeframe === '30-days') {
      const start = new Date()
      start.setDate(today.getDate() - 30)
      start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
    if (selectedTimeframe === '90-days') {
      const start = new Date()
      start.setDate(today.getDate() - 90)
      start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
    if (selectedTimeframe === 'ytd') {
      const start = new Date(today.getFullYear(), 0, 1)
      return { start, end: today }
    }
    if (selectedTimeframe === '12-months') {
      const start = new Date()
      start.setDate(today.getDate() - 365)
      start.setHours(0, 0, 0, 0)
      return { start, end: today }
    }
    // all
    return { start: new Date(1970, 0, 1), end: today }
  }, [selectedTimeframe])

  // ── Filter transactions ──
  const filteredTxs = useMemo(() => {
    return initialTransactions.filter((tx) => {
      // 1. Timeframe check
      const txDate = new Date(tx.date || tx.created_at)
      if (txDate < dateLimit.start || txDate > dateLimit.end) return false

      // 2. Account filter
      if (selectedAccount !== 'all' && tx.accounts?.id !== selectedAccount) return false

      // 3. Tx Type filter (for the list/search) - do not apply to main cash flow metrics yet
      if (selectedTxType !== 'all' && tx.type !== selectedTxType) return false

      // 4. Keyword search
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

  // ── Calculation of previous date limits for MoM/Comparison ──
  const previousDateLimit = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    if (selectedTimeframe === 'this-month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
      return { start, end }
    }
    if (selectedTimeframe === '30-days') {
      const start = new Date()
      start.setDate(today.getDate() - 60)
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setDate(today.getDate() - 31)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (selectedTimeframe === '90-days') {
      const start = new Date()
      start.setDate(today.getDate() - 180)
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setDate(today.getDate() - 91)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    if (selectedTimeframe === 'ytd') {
      const start = new Date(today.getFullYear() - 1, 0, 1)
      const end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      return { start, end }
    }
    if (selectedTimeframe === '12-months') {
      const start = new Date()
      start.setDate(today.getDate() - 730)
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setDate(today.getDate() - 366)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }
    // all
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
    let income = 0
    let expense = 0

    previousFilteredTxs.forEach((tx) => {
      if (tx.transfer_id) return
      if (tx.type === 'income') {
        income += tx.base_currency_amount || 0
      } else if (tx.type === 'expense') {
        expense += tx.base_currency_amount || 0
      }
    })

    const net = income - expense
    const savingsRate = income > 0 ? (net / income) * 100 : 0

    return { income, expense, net, savingsRate }
  }, [previousFilteredTxs])

  const categoryComparison = useMemo(() => {
    const map: Record<string, { name: string; current: number; previous: number; color: string }> = {}

    filteredTxs.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const catId = tx.categories?.id || 'uncategorized'
      const catName = tx.categories?.name || 'Uncategorized'
      const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'

      if (!map[catId]) {
        map[catId] = { name: catName, current: 0, previous: 0, color: catColor }
      }
      map[catId].current += tx.base_currency_amount || 0
    })

    previousFilteredTxs.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      const catId = tx.categories?.id || 'uncategorized'
      const catName = tx.categories?.name || 'Uncategorized'
      const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'

      if (!map[catId]) {
        map[catId] = { name: catName, current: 0, previous: 0, color: catColor }
      }
      map[catId].previous += tx.base_currency_amount || 0
    })

    return Object.values(map).map((item) => {
      const diff = item.current - item.previous
      const pctChange = item.previous > 0 ? (diff / item.previous) * 100 : 0
      return {
        ...item,
        diff,
        pctChange,
      }
    }).sort((a, b) => b.current - a.current)
  }, [filteredTxs, previousFilteredTxs])

  // ── Metrics for the filtered time span & account ──
  const totals = useMemo(() => {
    let income = 0
    let expense = 0

    // Only compute aggregates for income/expense, excluding transfer legs
    filteredTxs.forEach((tx) => {
      if (tx.transfer_id) return // exclude transfer legs from cash flow totals
      if (tx.type === 'income') {
        income += tx.base_currency_amount || 0
      } else if (tx.type === 'expense') {
        expense += tx.base_currency_amount || 0
      }
    })

    const net = income - expense
    const savingsRate = income > 0 ? (net / income) * 100 : 0

    return { income, expense, net, savingsRate }
  }, [filteredTxs])

  // ── Dynamic Dynamic Net Worth ──
  const dynamicNetWorth = useMemo(() => {
    if (selectedAccount === 'all') {
      return initialAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    } else {
      const activeArr = initialAccounts.filter(a => a.id === selectedAccount)
      return activeArr.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    }
  }, [initialAccounts, selectedAccount])

  // divisor to normalize the active timeframe into monthly units
  const monthDivisor = useMemo(() => {
    if (selectedTimeframe === 'this-month') return 1
    if (selectedTimeframe === '30-days') return 1
    if (selectedTimeframe === '90-days') return 3
    if (selectedTimeframe === 'ytd') return Math.max(1, new Date().getMonth() + 1)
    if (selectedTimeframe === '12-months') return 12
    return 12 // all timeframe fallback
  }, [selectedTimeframe])

  // Normal average monthly values of this timeframe
  const averageMonthlyExpense = useMemo(() => {
    return totals.expense / monthDivisor
  }, [totals.expense, monthDivisor])

  const averageMonthlyIncome = useMemo(() => {
    return totals.income / monthDivisor
  }, [totals.income, monthDivisor])

  // Simulated values based on slider controls
  const simulatedMonthlyExpenseValue = useMemo(() => {
    return averageMonthlyExpense * (1 + simulatedExpenseChange / 100)
  }, [averageMonthlyExpense, simulatedExpenseChange])

  const simulatedMonthlyIncomeValue = useMemo(() => {
    return averageMonthlyIncome * (1 + simulatedIncomeChange / 100)
  }, [averageMonthlyIncome, simulatedIncomeChange])

  // Dynamic exchange rate dictionary helper (reactive)
  const exchangeRatesMap = useMemo(() => {
    const isIDR = baseCurrency.toUpperCase() === 'IDR'
    return {
      USD: isIDR ? fxSimulatorUSD : 1,
      SGD: isIDR ? fxSimulatorSGD : 1.34,
      EUR: isIDR ? fxSimulatorEUR : 1.08,
      IDR: isIDR ? 1 : 1 / fxSimulatorUSD,
    }
  }, [baseCurrency, fxSimulatorUSD, fxSimulatorSGD, fxSimulatorEUR])

  // ── Last 12 Months Transaction History & Trends of Income vs Expense ──
  const last12MonthsTrend = useMemo(() => {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1, 0, 0, 0, 0)
    
    // Initialize 12 monthly slots
    const monthlyData: Record<string, { label: string; year: number; month: number; income: number; expense: number }> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'short' })
      monthlyData[key] = {
        label,
        year: d.getFullYear(),
        month: d.getMonth(),
        income: 0,
        expense: 0
      }
    }

    initialTransactions.forEach((tx) => {
      if (tx.transfer_id) return
      const tDate = new Date(tx.date || tx.created_at)
      if (tDate >= startDate && tDate <= today) {
        const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyData[key]) {
          if (tx.type === 'income') {
            monthlyData[key].income += tx.base_currency_amount || 0
          } else if (tx.type === 'expense') {
            monthlyData[key].expense += tx.base_currency_amount || 0
          }
        }
      }
    })

    return Object.values(monthlyData)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(group => ({
        name: `${group.label} ${String(group.year).slice(-2)}`,
        Income: group.income,
        Expense: group.expense,
        Savings: group.income - group.expense
      }))
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

        if (!map[catId]) {
          map[catId] = { name: catName, value: 0, color: catColor }
        }
        map[catId].value += tx.base_currency_amount || 0
      }
    })

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [initialTransactions])

  // ── Category-wise Spending (Only Expenses) ──
  const categorySpending = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; count: number }> = {}

    filteredTxs.forEach((tx) => {
      if (tx.type !== 'expense' || tx.transfer_id) return
      
      const catId = tx.categories?.id || 'uncategorized'
      const catName = tx.categories?.name || 'Uncategorized'
      const catColor = tx.categories?.color || CATEGORY_DEFAULT_COLORS[catName] || '#6b7280'

      if (!map[catId]) {
        map[catId] = {
          name: catName,
          value: 0,
          color: catColor,
          count: 0
        }
      }
      map[catId].value += tx.base_currency_amount || 0
      map[catId].count += 1
    })

    const result = Object.values(map).sort((a, b) => b.value - a.value)
    
    // Calculate percentages
    const totalExpenses = result.reduce((sum, item) => sum + item.value, 0)
    return result.map(item => ({
      ...item,
      percentage: totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0
    }))
  }, [filteredTxs])

  // ── Top Expenses List ──
  const topExpenses = useMemo(() => {
    return filteredTxs
      .filter((tx) => tx.type === 'expense' && !tx.transfer_id)
      .sort((a, b) => b.base_currency_amount - a.base_currency_amount)
      .slice(0, 5)
  }, [filteredTxs])

  // ── Multi-Month Cashflow Trend ──
  const cashflowTrend = useMemo(() => {
    const now = new Date()
    const monthlyData: Record<string, { label: string; year: number; month: number; income: number; expense: number }> = {}

    // Initialize last 6 months minimum
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleString('en-US', { month: 'short' })
      monthlyData[key] = {
        label,
        year: date.getFullYear(),
        month: date.getMonth(),
        income: 0,
        expense: 0
      }
    }

    // Accumulate transaction historicals
    initialTransactions.forEach((tx) => {
      if (tx.transfer_id) return
      const tDate = new Date(tx.date || tx.created_at)
      const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`

      if (monthlyData[key]) {
        if (tx.type === 'income') {
          monthlyData[key].income += tx.base_currency_amount || 0
        } else if (tx.type === 'expense') {
          monthlyData[key].expense += tx.base_currency_amount || 0
        }
      } else {
        // Also add if it fits dynamic broad ranges
        const diffMonths = (now.getFullYear() - tDate.getFullYear()) * 12 + now.getMonth() - tDate.getMonth()
        if (diffMonths >= 0 && diffMonths < 12) {
          const label = tDate.toLocaleString('en-US', { month: 'short' })
          monthlyData[key] = {
            label,
            year: tDate.getFullYear(),
            month: tDate.getMonth(),
            income: tx.type === 'income' ? tx.base_currency_amount : 0,
            expense: tx.type === 'expense' ? tx.base_currency_amount : 0
          }
        }
      }
    })

    return Object.values(monthlyData)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(group => ({
        name: `${group.label} ${String(group.year).slice(-2)}`,
        Income: group.income,
        Expense: group.expense,
        Savings: group.income - group.expense
      }))
  }, [initialTransactions])

  // ── Budgets Tracking Logic ──
  const activeBudgets = useMemo(() => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    return initialBudgets.map((budget) => {
      // Find actual transaction sum this month for this category
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

      return {
        ...budget,
        spent: currentMonthSpend,
        remaining,
        percentage: Math.min(100, pct),
        actualPct: pct
      }
    })
  }, [initialBudgets, initialTransactions])

  // ── Pagination logic ──
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTxs.length / itemsPerPage)
  }, [filteredTxs])

  const displayPage = useMemo(() => {
    return Math.min(currentPage, Math.max(1, totalPages))
  }, [currentPage, totalPages])

  const paginatedTxs = useMemo(() => {
    const start = (displayPage - 1) * itemsPerPage
    return filteredTxs.slice(start, start + itemsPerPage)
  }, [filteredTxs, displayPage])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-8">
      
      {/* ── HEADER & QUICK FILTERS ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Finance Control <span className="text-2xl opacity-40 font-light">| Dashboard</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time aggregates formulated in target base: <span className="font-semibold text-primary">{baseCurrency}</span>
          </p>
        </div>

        {/* Dynamic Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setCurrentViewMode('overview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentViewMode === 'overview'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setCurrentViewMode('analysis')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                currentViewMode === 'analysis'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🔍 Analysis Mode
            </button>
          </div>

          {/* Timeframe Badges */}
          <div className="flex bg-muted p-1 rounded-xl border border-border/40">
            {[
              { id: 'this-month', label: 'This Month' },
              { id: '30-days', label: '30 Days' },
              { id: '90-days', label: 'Last 3 Months' },
              { id: 'ytd', label: 'Year to Date' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTimeframe(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  selectedTimeframe === t.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Account Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="appearance-none bg-card border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              <option value="all">💳 All Accounts</option>
              {initialAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  💵 {a.name} ({a.currency})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
              <ListFilter size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* ── PRIMARY RESPONSIVE 2-COLUMN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ═══ LEFT/MAIN BODY (Columns 1-8) ═══ */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {currentViewMode === 'analysis' ? (
            <div className="space-y-6">
              {/* COMPARISON MODULES CARD */}
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Scale size={15} className="text-primary animate-pulse" /> Comparative Flow Performance
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Comparing current timeframe against previous equivalent period: <span className="font-semibold text-foreground">{formatDateLabel(previousDateLimit.start.toISOString())} to {formatDateLabel(previousDateLimit.end.toISOString())}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inflow compare */}
                  <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-sans">Inflow Comparison</span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-extrabold text-income tabular-nums">
                        {formatCurrency(totals.income, baseCurrency)}
                      </p>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="opacity-70">Prev: {formatCurrency(previousTotals.income, baseCurrency)}</span>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const diff = totals.income - previousTotals.income
                        const pct = previousTotals.income > 0 ? (diff / previousTotals.income) * 100 : 0
                        const isUp = diff >= 0
                        return (
                          <div className={`text-[11px] font-bold flex items-center gap-1 ${isUp ? 'text-income' : 'text-expense'}`}>
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{isUp ? 'Increased' : 'Decreased'} by {Math.abs(pct).toFixed(1)}%</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Outflow compare */}
                  <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-sans">Outflow Comparison</span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-extrabold text-expense tabular-nums">
                        {formatCurrency(totals.expense, baseCurrency)}
                      </p>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="opacity-70">Prev: {formatCurrency(previousTotals.expense, baseCurrency)}</span>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const diff = totals.expense - previousTotals.expense
                        const pct = previousTotals.expense > 0 ? (diff / previousTotals.expense) * 100 : 0
                        const isUp = diff >= 0
                        return (
                          <div className={`text-[11px] font-bold flex items-center gap-1 ${isUp ? 'text-expense' : 'text-income'}`}>
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{isUp ? 'Spent more' : 'Spent less'} by {Math.abs(pct).toFixed(1)}%</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Profit Margin / Net Compare */}
                  <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-sans">Net Surplus Growth</span>
                    <div className="flex items-baseline justify-between">
                      <p className={`text-lg font-extrabold tabular-nums ${totals.net >= 0 ? 'text-foreground' : 'text-expense'}`}>
                        {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net, baseCurrency)}
                      </p>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="opacity-70">Prev: {previousTotals.net >= 0 ? '+' : ''}{formatCurrency(previousTotals.net, baseCurrency)}</span>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const diff = totals.net - previousTotals.net
                        const pct = previousTotals.net !== 0 ? (diff / Math.abs(previousTotals.net)) * 100 : 0
                        const isUp = diff >= 0
                        return (
                          <div className={`text-[11px] font-bold flex items-center gap-1 ${isUp ? 'text-income' : 'text-expense'}`}>
                            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>Margin delta: {isUp ? '+' : ''}{formatCurrency(diff, baseCurrency)} ({isUp ? 'up' : 'down'} {Math.abs(pct).toFixed(1)}%)</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Savings rate comparison */}
                  <div className="p-4 border border-border/30 rounded-xl bg-card/20 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-sans">Savings Rate Comparison</span>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-extrabold text-foreground tabular-nums">
                        {Math.round(totals.savingsRate)}%
                      </p>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="opacity-70 font-mono">Prev: {Math.round(previousTotals.savingsRate)}%</span>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const diff = totals.savingsRate - previousTotals.savingsRate
                        const isUp = diff >= 0
                        return (
                          <div className={`text-[11px] font-bold flex items-center gap-1 ${isUp ? 'text-income' : 'text-expense'}`}>
                            {isUp ? '▲' : '▼'}
                            <span>{isUp ? 'Increased' : 'Decreased'} by {Math.abs(diff).toFixed(1)}% savings capacity</span>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 12 MONTH TRENDS & TOP CATEGORIES GRIDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Income vs. Expense Trends Chart (12 Months) */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Activity size={15} className="text-primary" /> 12-Month Flow Trend
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Monthly comparison of aggregate inflows and outflows
                    </p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={last12MonthsTrend}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <XAxis 
                          dataKey="name" 
                          stroke="#888888" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#888888" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(v) => `${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            fontSize: '11px',
                          }}
                          formatter={(value) => [
                            formatCurrency(Number(value ?? 0), baseCurrency),
                            '',
                          ]}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle" 
                          iconSize={8}
                          wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                        />
                        <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} name="Inflow" />
                        <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Outflow" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top 5 Expense Category Breakdown (12 Months) */}
                <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Coins size={15} className="text-primary" /> Top 5 Categories (12M)
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Largest spend sectors over the past 12 months
                    </p>
                  </div>

                  {last12MonthsTop5Categories.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center">
                      <p className="text-xs text-muted-foreground">No recent expenditures cataloged.</p>
                    </div>
                  ) : (
                    <div className="h-64 grid grid-cols-1 md:grid-cols-12 items-center gap-2">
                      <div className="md:col-span-7 h-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={last12MonthsTop5Categories}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {last12MonthsTop5Categories.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '12px',
                                fontSize: '11px',
                              }}
                              formatter={(value) => [
                              formatCurrency(Number(value ?? 0), baseCurrency),
                              '',
                            ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Centered Total label inside donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider animate-pulse">Total</span>
                          <span className="text-xs font-extrabold text-foreground">
                            {formatCurrency(last12MonthsTop5Categories.reduce((sum, c) => sum + c.value, 0), baseCurrency)}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-5 flex flex-col gap-2 max-h-full overflow-y-auto">
                        {last12MonthsTop5Categories.map((cat, idx) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs font-medium">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
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

              {/* CATEGORIES VARIANCE ANALYZER */}
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Category Spending Variance</h3>
                  <p className="text-[11px] text-muted-foreground">Find leaks under current active timeframe versus past timeframe</p>
                </div>

                {categoryComparison.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No spending records in this era.</p>
                ) : (
                  <div className="border border-border/20 rounded-xl overflow-hidden divide-y divide-border/10">
                    <div className="grid grid-cols-12 gap-2 p-3 bg-muted/40 text-[10px] font-bold uppercase text-muted-foreground">
                      <div className="col-span-4">Category</div>
                      <div className="col-span-3 text-right">Current</div>
                      <div className="col-span-3 text-right">Previous</div>
                      <div className="col-span-2 text-right">Variation</div>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border/15">
                      {categoryComparison.map((cat) => {
                        const isIncrease = cat.diff > 0
                        return (
                          <div key={cat.name} className="grid grid-cols-12 gap-2 p-3 text-xs items-center hover:bg-muted/10 transition">
                            <div className="col-span-4 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
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

              {/* RUNWAY RUNBURN RATE PROJECTION SIMULATOR */}
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary animate-pulse" /> Capital Runway Simulator & Burn Rate Projection
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Estimate lifetime capital longevity based on cashflow velocity and customized adjustments
                  </p>
                </div>

                {/* KPI Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Base Net Capital</span>
                    <p className="text-base font-extrabold text-foreground tabular-nums">{formatCurrency(dynamicNetWorth, baseCurrency)}</p>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Adjusted Deficit Outbound</span>
                    <p className="text-base font-extrabold text-expense tabular-nums">-{formatCurrency(simulatedMonthlyExpenseValue, baseCurrency)}/mo</p>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/20 rounded-xl space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Adjusted Inflow Surplus</span>
                    <p className="text-base font-extrabold text-income tabular-nums">+{formatCurrency(simulatedMonthlyIncomeValue, baseCurrency)}/mo</p>
                  </div>
                </div>

                {/* Symmetrical Sliders */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1">Modulate Inflows: <span className="text-income">{simulatedIncomeChange >= 0 ? '+' : ''}{simulatedIncomeChange}%</span></span>
                      <button onClick={() => setSimulatedIncomeChange(0)} className="text-[10px] text-primary hover:underline font-semibold">Reset Inflow</button>
                    </div>
                    <input 
                      type="range"
                      min="-50"
                      max="100"
                      step="5"
                      value={simulatedIncomeChange}
                      onChange={(e) => setSimulatedIncomeChange(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-border"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground flex items-center gap-1">Modulate Outflows: <span className="text-expense">{simulatedExpenseChange >= 0 ? '+' : ''}{simulatedExpenseChange}%</span></span>
                      <button onClick={() => setSimulatedExpenseChange(0)} className="text-[10px] text-primary hover:underline font-semibold">Reset Outflow</button>
                    </div>
                    <input 
                      type="range"
                      min="-50"
                      max="100"
                      step="5"
                      value={simulatedExpenseChange}
                      onChange={(e) => setSimulatedExpenseChange(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer h-1 rounded-lg bg-border"
                    />
                  </div>
                </div>

                {/* Diagnosis status component */}
                {(() => {
                  const surplusLoss = simulatedMonthlyIncomeValue - simulatedMonthlyExpenseValue
                  const isDepleting = surplusLoss < 0
                  const monthlyLoss = Math.abs(surplusLoss)
                  
                  // division safety
                  const runwayMonths = isDepleting 
                    ? (simulatedMonthlyExpenseValue > 0 ? (dynamicNetWorth / monthlyLoss) : 999) 
                    : 999
                  
                  let diagnosisText = ""
                  let diagnosisDesc = ""
                  let statusBg = ""
                  let statusText = ""

                  if (!isDepleting) {
                    diagnosisText = "Self-Sustaining Accumulation"
                    diagnosisDesc = "Congratulations! Your simulated income fully covers your expenses. Your base cash reserves are growing, providing infinitely stable capitalization!"
                    statusBg = "bg-income/10 border-income/30"
                    statusText = "text-income"
                  } else {
                    if (runwayMonths < 3) {
                      diagnosisText = "Critical Depletion Stage"
                      diagnosisDesc = `Your capital reserves are shrinking aggressively. At this burn, you will deplete net worth in ${runwayMonths.toFixed(1)} months. Consider scaling back overhead immediately.`
                      statusBg = "bg-expense/10 border-expense/30"
                      statusText = "text-expense"
                    } else if (runwayMonths < 6) {
                      diagnosisText = "Restricted Buffer Warning"
                      diagnosisDesc = `Reserves will sustain operations for a moderate span of ${runwayMonths.toFixed(1)} months. Building more cash cushions is advised.`
                      statusBg = "bg-orange-500/10 border-orange-500/30"
                      statusText = "text-orange-500"
                    } else if (runwayMonths < 12) {
                      diagnosisText = "Healthy Runway Cushion"
                      diagnosisDesc = `Your capital reserves are comfortable, supporting your lifestyle for ${runwayMonths.toFixed(1)} months under current burn configurations.`
                      statusBg = "bg-primary/10 border-primary/30"
                      statusText = "text-primary"
                    } else {
                      diagnosisText = "Ironclad Capital Runway"
                      diagnosisDesc = `An exceptional fiscal buffer of ${runwayMonths.toFixed(1)} months or longer! Your asset allocation gives maximum safety.`
                      statusBg = "bg-emerald-500/10 border-emerald-500/30"
                      statusText = "text-emerald-500"
                    }
                  }

                  return (
                    <div className={`p-4 border rounded-xl leading-relaxed space-y-1.5 ${statusBg}`}>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold uppercase tracking-wider ${statusText}`}>Diagnosis: {diagnosisText}</span>
                      </div>
                      <p className="text-xs text-foreground/80 font-medium">
                        {diagnosisDesc}
                      </p>
                      {isDepleting && (
                        <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between">
                          <span>Monthly Depletion Velocity: <strong>-{formatCurrency(monthlyLoss, baseCurrency)}</strong></span>
                          <span>Est. Lifespan: <strong>{runwayMonths.toFixed(1)} Months</strong></span>
                        </div>
                      )}
                    </div>
                  )
                })()}

              </div>
            </div>
          ) : (
            <>
              {/* 1. KEY KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Base Net Worth</span>
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatCurrency(dynamicNetWorth, baseCurrency)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                  {initialAccounts.length} accounts configured
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-income/20 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-income/80">Inflow</span>
                <TrendingUp className="w-4 h-4 text-income" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-income tabular-nums">
                  +{formatCurrency(totals.income, baseCurrency)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Target filter range
                </p>
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-income/5 rounded-full blur-xl pointer-events-none" />
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-expense/20 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-expense/80">Outflow</span>
                <TrendingDown className="w-4 h-4 text-expense" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold tracking-tight text-expense tabular-nums">
                  −{formatCurrency(totals.expense, baseCurrency)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Excludes transfer loops
                </p>
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-expense/5 rounded-full blur-xl pointer-events-none" />
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-sm hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between text-muted-foreground mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Savings</span>
                <PiggyBank className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className={`text-xl md:text-2xl font-bold tracking-tight tabular-nums ${totals.net >= 0 ? 'text-foreground' : 'text-expense'}`}>
                  {totals.net >= 0 ? '+' : ''}{formatCurrency(totals.net, baseCurrency)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <span>Savings rate:</span> 
                  <span className={`font-semibold ${totals.net >= 0 ? 'text-income' : 'text-expense'}`}>
                    {Math.round(totals.savingsRate)}%
                  </span>
                </p>
              </div>
            </div>

          </div>

          {/* 2. CHARTS REGION: CASHFLOW TRENDS & DONUT CATEGORIES */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Cashflow Trend Chart (C1-C7) */}
            <div className="md:col-span-7 bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 animate-pulse">
                    <Activity size={14} className="text-primary" /> Trend Distribution
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Historical trailing performance</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold">
                  <span className="flex items-center gap-1 text-income"><span className="w-2 h-2 rounded-full bg-income" /> Inflow</span>
                  <span className="flex items-center gap-1 text-expense"><span className="w-2 h-2 rounded-full bg-expense" /> Outflow</span>
                </div>
              </div>

              <div className="h-64 w-full">
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
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 9 }}
                        tickFormatter={(v) => formatCurrency(v, baseCurrency).replace('$', '').replace('IDR', '')}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                          color: 'var(--foreground)'
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val || 0), baseCurrency), '']}
                      />
                      <Area type="monotone" dataKey="Income" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="Expense" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Preparing trend aggregates...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Breakdown Donut (C8-C12) */}
            <div className="md:col-span-5 bg-card border border-border/70 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Expense Struct</h3>
                <p className="text-[11px] text-muted-foreground">Relative base breakdown</p>
              </div>

              {categorySpending.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle size={24} className="text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">No expenses recorded in date filters.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-44 w-full relative">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySpending}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={3}
                          >
                            {categorySpending.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.color} 
                                style={{
                                  opacity: hoveredCategory === null || hoveredCategory === entry.name ? 1 : 0.45,
                                  transition: 'opacity 0.2s ease-in-out'
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(val: any) => formatCurrency(Number(val || 0), baseCurrency)}
                            contentStyle={{ borderRadius: '10px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-muted/20 animate-pulse rounded-xl" />
                    )}
                    {/* Centered Donut Total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Out</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {formatCurrency(categorySpending.reduce((s, c) => s + c.value, 0), baseCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Highlights panel */}
                  <div className="flex flex-col gap-1 mt-2 max-h-[110px] overflow-y-auto pr-1">
                    {categorySpending.slice(0, 3).map((item) => (
                      <div 
                        key={item.name} 
                        className="flex items-center justify-between text-xs p-1 rounded-lg hover:bg-muted/30 transition"
                        onMouseEnter={() => setHoveredCategory(item.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-md" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-foreground truncate">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground font-mono">
                          {Math.round(item.percentage)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 3. DYNAMIC INTERACTIVE FILTER FEED & SEARCH */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Transactions Log</h3>
                <p className="text-[11px] text-muted-foreground">{filteredTxs.length} items match constraints</p>
              </div>

              {/* Dynamic Search & Flow Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 md:w-48">
                  <Search size={12} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full bg-muted border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  />
                </div>
                
                <select
                  value={selectedTxType}
                  onChange={(e) => setSelectedTxType(e.target.value)}
                  className="bg-muted border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  <option value="all">♻️ All Types</option>
                  <option value="expense">📉 Expenses</option>
                  <option value="income">📈 Income</option>
                  <option value="transfer">⇄ Transfers</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            {filteredTxs.length === 0 ? (
              <div className="py-12 text-center bg-muted/10 border border-dashed rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">No results found matching transaction conditions.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedTxType('all'); setSelectedAccount('all'); }} 
                  className="text-xs text-primary font-semibold mt-2 underline"
                >
                  Clear settings filters
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTxs.map((tx) => {
                  const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
                  const isTransfer = tx.type === 'transfer'
                  const color = tx.categories?.color || CATEGORY_DEFAULT_COLORS[tx.categories?.name || ''] || '#3b82f6'
                  
                  return (
                    <motion.div
                      layoutId={`tx-row-${tx.id}`}
                      key={tx.id}
                      className="flex items-center justify-between p-3.5 bg-card/40 border border-border/30 rounded-xl hover:bg-muted/10 transition"
                    >
                      {/* Left icon & description */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div 
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold relative shrink-0"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          {isTransfer ? '⇄' : (tx.categories?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">
                            {tx.description || tx.categories?.name || 'Unspecified'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
                            <span>{tx.accounts?.name || '—'}</span>
                            <span>•</span>
                            <span>{formatDateLabel(tx.date)}</span>
                            {isTransfer && (
                              <>
                                <span>•</span>
                                <span className="bg-primary/10 text-primary px-1 rounded text-[9px] uppercase font-bold">Transfer</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right amount metrics */}
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
                    </motion.div>
                  )
                })}

                {/* Pagination bar */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/40 text-xs">
                    <span className="text-muted-foreground">Showing page {displayPage} of {totalPages}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                        disabled={displayPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-border/80 text-[11px] font-semibold transition disabled:opacity-30"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                        disabled={displayPage === totalPages}
                        className="px-2.5 py-1.5 rounded-lg border border-border/80 text-[11px] font-semibold transition disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
            </>
          )}

        </div>

        {/* ═══ RIGHT COLUMN: SIDEBAR INSIGHTS (Columns 9-12) ═══ */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. DESIGN ACCOUNT QUICK ACCESS LIST */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Accounts overview</h3>
              <Link href="/accounts" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
                Manage <ChevronRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {initialAccounts.map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  className={`flex items-center justify-between p-3 border rounded-xl hover:bg-muted/10 transition group ${
                    selectedAccount === account.id ? 'border-primary/55 bg-primary/5' : 'border-border/30 bg-card/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-extrabold"
                      style={{
                        backgroundColor: account.color ? `${account.color}15` : 'rgba(255,255,255,0.06)',
                        color: account.color || 'var(--foreground)'
                      }}
                    >
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{account.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold tabular-nums ${account.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* B. TOP EXPENSE SINGLE DETAILS */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top Single Expenses</h3>
              <p className="text-[10px] text-muted-foreground">Largest investments this period</p>
            </div>

            {topExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No records found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {topExpenses.map((tx) => {
                  const color = tx.categories?.color || CATEGORY_DEFAULT_COLORS[tx.categories?.name || ''] || '#ef4444'
                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-border/20 bg-card/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0"
                          style={{ backgroundColor: `${color}15`, color: color }}
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* C. ACTIVE BUDGET PROGRESS MODULE */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Budgets</h3>
                <p className="text-[10px] text-muted-foreground">Limit checks this month</p>
              </div>
              <Link href="/budgets" className="text-[11px] font-bold text-primary hover:underline">
                All
              </Link>
            </div>

            {activeBudgets.length === 0 ? (
              <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border">
                <p className="text-xs text-muted-foreground">No active budgets scheduled.</p>
                <Link href="/budgets/new" className="text-[11px] text-primary underline mt-1.5 inline-block font-semibold">
                  Setup dynamic budget
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBudgets.map((budget) => {
                  const isOver = budget.spent > budget.amount
                  const color = budget.categories?.color || CATEGORY_DEFAULT_COLORS[budget.categories?.name || ''] || '#fbbf24'
                  return (
                    <div key={budget.id} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                          {budget.name}
                        </span>
                        <div className="font-semibold text-right tabular-nums">
                          <span className={isOver ? 'text-expense' : 'text-foreground'}>
                            {formatCurrency(budget.spent, budget.currency)}
                          </span>
                          <span className="text-muted-foreground font-normal">
                             / {formatCurrency(budget.amount, budget.currency)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Range slider bar */}
                      <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOver ? 'bg-expense' : 'bg-primary'
                          }`}
                          style={{ width: `${budget.percentage}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                        <span>{isOver ? 'Spent overrun' : `${Math.round(budget.percentage)}% consumed`}</span>
                        <span className={`font-semibold ${isOver ? 'text-expense' : 'text-income'}`}>
                          {isOver 
                            ? `Over budget by ${formatCurrency(Math.abs(budget.remaining), budget.currency)}` 
                            : `${formatCurrency(budget.remaining, budget.currency)} remaining`}
                        </span>
                      </div>
                    </div>
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