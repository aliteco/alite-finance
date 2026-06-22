// filepath: alite/src/lib/engines/legacy-insights-adapter.ts

import { ExchangeRateService } from '@/lib/services/exchange-rate-service'
import { AnalyticsEngine, type AnalyticsTransaction } from '@/lib/engines/analytics-engine'

export interface LegacyAccount {
  id: string
  currency: string
  balance: number
}

export const InsightsEngine = {
  async computeInsights(
    accounts: LegacyAccount[],
    transactions: AnalyticsTransaction[],
    baseCurrency: string
  ) {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const trailing30 = transactions.filter(t => new Date(t.date || t.created_at) >= thirtyDaysAgo)

    const { income: monthlyIncome, expense: monthlyExpenses, net: netSavings, savingsRate } =
      await AnalyticsEngine.savingsRate(trailing30, baseCurrency)

    const spendingByCategory = await AnalyticsEngine.spendingByCategory(trailing30, baseCurrency)
    const cashflowTrends = await AnalyticsEngine.cashflowTrend(transactions, baseCurrency, 6)
    const detectedSubscriptions = AnalyticsEngine.detectSubscriptions(transactions)

    const balances = accounts.map(a => ({ amount: a.balance, currency: a.currency }))
    const convertedBalances = await ExchangeRateService.convertBatch(balances, baseCurrency)
    const totalNetWorthInBase = convertedBalances.reduce((s, v) => s + v, 0)

    const monthlyBurnRate = monthlyExpenses
    const runwayMonths = monthlyExpenses > 0
      ? parseFloat((totalNetWorthInBase / monthlyExpenses).toFixed(1))
      : Infinity

    const forecastTimeline: { name: string; value: number }[] = []
    let projectedNetWorth = totalNetWorthInBase
    for (let m = 1; m <= 6; m++) {
      const fd = new Date()
      fd.setMonth(fd.getMonth() + m)
      projectedNetWorth += netSavings
      forecastTimeline.push({
        name: fd.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
        value: Math.round(projectedNetWorth),
      })
    }

    return {
      monthlyIncome: Math.round(monthlyIncome),
      monthlyExpenses: Math.round(monthlyExpenses),
      netSavings: Math.round(netSavings),
      savingsRate: Math.round(savingsRate),
      runwayMonths,
      monthlyBurnRate: Math.round(monthlyBurnRate),
      spendingByCategory,
      detectedSubscriptions: detectedSubscriptions.map(s => ({
        description: s.description,
        category: s.category,
        amount: s.amount,
        currency: s.currency,
        frequency: s.frequency,
        lastBilled: s.lastBilled,
      })),
      cashflowTrends: cashflowTrends.slice(-6).map(c => ({
        month: c.month,
        income: Math.round(c.income),
        expense: Math.round(c.expense),
        savings: Math.round(c.savings),
      })),
      forecastTimeline,
    }
  },
}