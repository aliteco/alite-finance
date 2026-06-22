// filepath: alite/src/app/actions/analytics.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { AnalyticsEngine, type AnalyticsTransaction } from '@/lib/engines/analytics-engine'
import { NetWorthEngine, type NetWorthAccount } from '@/lib/engines/net-worth-engine'

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

async function getTrailingTransactions(months: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - months)
  const cutoffISO = cutoff.toISOString().slice(0, 10)

  const [profileRes, txRes, accountsRes] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),
    supabase
      .from('transactions')
      .select(`
        id, type, amount, currency, description, date, created_at, transfer_id,
        categories ( id, name, color )
      `)
      .eq('user_id', user.id)
      .gte('date', cutoffISO)
      .order('date', { ascending: false }),
    supabase
      .from('accounts')
      .select('id, currency, balance, include_in_net_worth, is_active')
      .eq('user_id', user.id),
  ])

  return {
    supabase,
    baseCurrency: profileRes.data?.base_currency ?? 'IDR',
    transactions: (txRes.data as unknown as AnalyticsTransaction[]) ?? [],
    accounts: (accountsRes.data as unknown as NetWorthAccount[]) ?? [],
  }
}

export async function getCashflowReport(months = 6) {
  const { supabase, baseCurrency, transactions } = await getTrailingTransactions(months)
  return AnalyticsEngine.cashflowTrend(transactions, baseCurrency, months, supabase)
}

export async function getSpendingBreakdown(months = 1) {
  const { supabase, baseCurrency, transactions } = await getTrailingTransactions(months)
  return AnalyticsEngine.spendingByCategory(transactions, baseCurrency, supabase)
}

export async function getSavingsRateReport(months = 1) {
  const { supabase, baseCurrency, transactions } = await getTrailingTransactions(months)
  return AnalyticsEngine.savingsRate(transactions, baseCurrency, supabase)
}

export async function getBurnRateReport(lookbackMonths = 3) {
  const { supabase, baseCurrency, transactions, accounts } = await getTrailingTransactions(Math.max(lookbackMonths, 1))
  const netWorth = await NetWorthEngine.currentNetWorth(accounts, baseCurrency, supabase)
  return AnalyticsEngine.burnRate(transactions, netWorth, baseCurrency, lookbackMonths, supabase)
}

export async function getDetectedSubscriptions() {
  const { supabase, baseCurrency, transactions } = await getTrailingTransactions(13)
  const subs = AnalyticsEngine.detectSubscriptions(transactions)
  const projectedMonthlyCost = await AnalyticsEngine.projectedMonthlySubscriptionCost(subs, baseCurrency, supabase)
  return { subscriptions: subs, projectedMonthlyCost, baseCurrency }
}

export async function getNetWorthTimeSeries(days = 30) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const [profileRes, accountsRes, txRes] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),
    supabase
      .from('accounts')
      .select('id, currency, balance, include_in_net_worth, is_active')
      .eq('user_id', user.id),
    supabase
      .from('transactions')
      .select('account_id, type, amount, date, created_at, transfer_type')
      .eq('user_id', user.id)
      .gte('date', new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const accounts = (accountsRes.data as unknown as NetWorthAccount[]) ?? []
  const transactions = txRes.data ?? []

  return NetWorthEngine.getHistoricalSnapshots(accounts, transactions, baseCurrency, days, supabase)
}