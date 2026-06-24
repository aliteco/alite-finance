// filepath: alite/src/lib/engines/analytics-engine.ts

import { ExchangeRateService } from '@/lib/services/exchange-rate-service'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AnalyticsCategory {
  id: string | null
  name: string | null
  color: string | null
}

export interface AnalyticsTransaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  currency: string
  description: string | null
  date: string
  created_at: string
  transfer_id: string | null
  categories: AnalyticsCategory | null
}

export interface CategorySpend {
  category_id: string | null
  name: string
  value: number
  color: string
  count: number
  percentage: number
}

export interface CashflowPoint {
  month: string
  income: number
  expense: number
  savings: number
}

export interface SavingsRateResult {
  income: number
  expense: number
  net: number
  savingsRate: number // percentage, 0-100 (can be negative)
}

export interface BurnRateResult {
  netWorth: number
  monthlyBurn: number
  runwayMonths: number // Infinity if not burning
}

export interface DetectedSubscription {
  description: string
  category: string
  amount: number
  currency: string
  frequency: 'Weekly' | 'Monthly' | 'Annually'
  lastBilled: string
  occurrenceCount: number
}

const DEFAULT_CATEGORY_COLOR = '#9ca3af'

export const AnalyticsEngine = {
  async toBaseAmounts(
    txs: AnalyticsTransaction[],
    baseCurrency: string,
    client?: SupabaseClient
  ): Promise<number[]> {
    return ExchangeRateService.convertBatch(
      txs.map(t => ({ amount: t.amount, currency: t.currency })),
      baseCurrency
    )
  },

  /** Income, expense, net, and savings rate over the given transaction set (transfers excluded). */
  async savingsRate(
    txs: AnalyticsTransaction[],
    baseCurrency: string,
    client?: SupabaseClient
  ): Promise<SavingsRateResult> {
    const relevant = txs.filter(t => !t.transfer_id && (t.type === 'income' || t.type === 'expense'))
    const baseAmounts = await this.toBaseAmounts(relevant, baseCurrency, client)

    let income = 0
    let expense = 0
    relevant.forEach((t, i) => {
      if (t.type === 'income') income += baseAmounts[i]
      else expense += baseAmounts[i]
    })

    const net = income - expense
    const savingsRate = income > 0 ? (net / income) * 100 : 0
    return { income, expense, net, savingsRate }
  },

  /** Groups expense transactions by category, normalized to baseCurrency, sorted descending. */
  async spendingByCategory(
    txs: AnalyticsTransaction[],
    baseCurrency: string,
    client?: SupabaseClient
  ): Promise<CategorySpend[]> {
    const expenses = txs.filter(t => t.type === 'expense' && !t.transfer_id)
    const baseAmounts = await this.toBaseAmounts(expenses, baseCurrency, client)

    const map: Record<string, CategorySpend> = {}
    expenses.forEach((t, i) => {
      const id = t.categories?.id ?? 'uncategorized'
      const name = t.categories?.name ?? 'Uncategorized'
      const color = t.categories?.color ?? DEFAULT_CATEGORY_COLOR
      if (!map[id]) map[id] = { category_id: t.categories?.id ?? null, name, color, value: 0, count: 0, percentage: 0 }
      map[id].value += baseAmounts[i]
      map[id].count += 1
    })

    const list = Object.values(map).sort((a, b) => b.value - a.value)
    const total = list.reduce((s, c) => s + c.value, 0)
    return list.map(c => ({ ...c, percentage: total > 0 ? (c.value / total) * 100 : 0 }))
  },

  /** Monthly income/expense/savings series for the trailing `months` months. */
  async cashflowTrend(
    txs: AnalyticsTransaction[],
    baseCurrency: string,
    months = 6,
    client?: SupabaseClient
  ): Promise<CashflowPoint[]> {
    const relevant = txs.filter(t => !t.transfer_id && (t.type === 'income' || t.type === 'expense'))
    const baseAmounts = await this.toBaseAmounts(relevant, baseCurrency, client)

    const now = new Date()
    const buckets: Record<string, { label: string; year: number; month: number; income: number; expense: number }> = {}
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 }
    }

    relevant.forEach((t, i) => {
      const d = new Date(t.date || t.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!buckets[key]) return
      if (t.type === 'income') buckets[key].income += baseAmounts[i]
      else buckets[key].expense += baseAmounts[i]
    })

    return Object.values(buckets)
      .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
      .map(b => ({
        month: `${b.label} ${String(b.year).slice(-2)}`,
        income: b.income,
        expense: b.expense,
        savings: b.income - b.expense,
      }))
  },

  /**
   * Burn rate: average monthly expense over the trailing `lookbackMonths`,
   * and how many months current net worth would last at that rate net of
   * average income. Infinity means net worth is growing, not depleting.
   */
  async burnRate(
    txs: AnalyticsTransaction[],
    netWorth: number,
    baseCurrency: string,
    lookbackMonths = 3,
    client?: SupabaseClient
  ): Promise<BurnRateResult> {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - lookbackMonths)
    const windowed = txs.filter(t => new Date(t.date || t.created_at) >= cutoff)
    const { income, expense } = await this.savingsRate(windowed, baseCurrency, client)

    const monthlyIncome = income / lookbackMonths
    const monthlyExpenseAvg = expense / lookbackMonths
    const monthlyNet = monthlyIncome - monthlyExpenseAvg

    const runwayMonths = monthlyNet < 0 && monthlyExpenseAvg > 0
      ? netWorth / Math.abs(monthlyNet)
      : Infinity

    return { netWorth, monthlyBurn: monthlyExpenseAvg, runwayMonths }
  },

  /**
   * Detects recurring subscription-like spending by grouping expenses with
   * identical (case-insensitive) descriptions and checking whether their
   * occurrence intervals cluster around weekly (5-9d), monthly (25-35d),
   * or annual (350-375d) cadences. Heuristic, not a guarantee.
   */
  detectSubscriptions(txs: AnalyticsTransaction[]): DetectedSubscription[] {
    const groups: Record<string, { description: string; category: string; amount: number; currency: string; dates: string[] }> = {}

    txs.forEach(t => {
      if (t.type !== 'expense' || !t.description) return
      const key = t.description.toLowerCase().trim()
      if (!key) return
      if (!groups[key]) {
        groups[key] = {
          description: t.description,
          category: t.categories?.name ?? 'Subscription',
          amount: t.amount,
          currency: t.currency,
          dates: [],
        }
      }
      groups[key].dates.push(t.date)
    })

    const results: DetectedSubscription[] = []
    for (const g of Object.values(groups)) {
      if (g.dates.length < 2) continue
      const sorted = [...g.dates].sort()
      const intervals: number[] = []
      for (let i = 1; i < sorted.length; i++) {
        const diffMs = new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()
        intervals.push(Math.round(diffMs / (1000 * 60 * 60 * 24)))
      }
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length

      let frequency: DetectedSubscription['frequency'] | null = null
      if (avgInterval >= 5 && avgInterval <= 9) frequency = 'Weekly'
      else if (avgInterval >= 25 && avgInterval <= 35) frequency = 'Monthly'
      else if (avgInterval >= 350 && avgInterval <= 375) frequency = 'Annually'
      if (!frequency) continue

      results.push({
        description: g.description,
        category: g.category,
        amount: g.amount,
        currency: g.currency,
        frequency,
        lastBilled: sorted[sorted.length - 1],
        occurrenceCount: sorted.length,
      })
    }

    return results.sort((a, b) => new Date(b.lastBilled).getTime() - new Date(a.lastBilled).getTime())
  },

  /** Normalizes a list of detected subscriptions' amounts into a single monthly-equivalent total in baseCurrency. */
  async projectedMonthlySubscriptionCost(
    subs: DetectedSubscription[],
    baseCurrency: string,
    client?: SupabaseClient
  ): Promise<number> {
    if (subs.length === 0) return 0
    const baseAmounts = await ExchangeRateService.convertBatch(
      subs.map(s => ({ amount: s.amount, currency: s.currency })),
      baseCurrency
    )
    return subs.reduce((sum, s, i) => {
      const monthlyEquivalent =
        s.frequency === 'Weekly' ? baseAmounts[i] * 4.33 :
        s.frequency === 'Annually' ? baseAmounts[i] / 12 :
        baseAmounts[i]
      return sum + monthlyEquivalent
    }, 0)
  },
}