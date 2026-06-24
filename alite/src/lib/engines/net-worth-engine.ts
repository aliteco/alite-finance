// filepath: alite/src/lib/engines/net-worth-engine.ts

import { ExchangeRateService } from '@/lib/services/exchange-rate-service'

export interface NetWorthAccount {
  id: string
  currency: string
  balance: number
  include_in_net_worth?: boolean
  is_active?: boolean
}

export interface NetWorthTransaction {
  account_id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  date: string
  created_at: string
  transfer_type?: 'debit' | 'credit' | null
}

export interface NetWorthSnapshot {
  dateStr: string
  label: string
  value: number
}

/**
 * NetWorthEngine — all net worth math lives here. Pages and components
 * call these pure/async functions and render the result; they never sum
 * account balances or roll back transactions themselves.
 */
export const NetWorthEngine = {
  /**
   * Sums account balances normalized into baseCurrency "as of now".
   * Excludes accounts where include_in_net_worth === false or
   * is_active === false (when those fields are present).
   */
  async currentNetWorth(
    accounts: NetWorthAccount[],
    baseCurrency: string
  ): Promise<number> {
    const eligible = accounts.filter(
      a => a.include_in_net_worth !== false && a.is_active !== false
    )

    if (eligible.length === 0) return 0

    const converted = await ExchangeRateService.convertBatch(
      eligible.map(a => ({
        amount: a.balance,
        currency: a.currency,
      })),
      baseCurrency
    )

    return converted.reduce((sum, v) => sum + v, 0)
  },

  /**
   * Reconstructs per-account balances at an arbitrary point in time by
   * rolling back every transaction that occurred at or after that time,
   * starting from the current balance. O(accounts + transactions).
   */
  computeHistoricalBalances(
    accounts: NetWorthAccount[],
    transactions: NetWorthTransaction[],
    asOf: Date
  ): Record<string, number> {
    const targetTime = asOf.getTime()

    const balances: Record<string, number> = {}

    for (const acc of accounts) {
      balances[acc.id] = acc.balance
    }

    const sorted = [...transactions].sort((a, b) => {
      const aTime = new Date(a.date || a.created_at).getTime()
      const bTime = new Date(b.date || b.created_at).getTime()
      return bTime - aTime
    })

    for (const tx of sorted) {
      const txTime = new Date(tx.date || tx.created_at).getTime()

      if (txTime < targetTime) continue
      if (balances[tx.account_id] === undefined) continue

      if (tx.type === 'income') {
        balances[tx.account_id] -= tx.amount
      } else if (tx.type === 'expense') {
        balances[tx.account_id] += tx.amount
      } else if (tx.type === 'transfer') {
        if (tx.transfer_type === 'debit') {
          balances[tx.account_id] += tx.amount
        } else if (tx.transfer_type === 'credit') {
          balances[tx.account_id] -= tx.amount
        }
      }
    }

    return balances
  },

  /**
   * Produces a daily time series of base-currency net worth for the
   * trailing `days` days (inclusive of today).
   */
  async getHistoricalSnapshots(
    accounts: NetWorthAccount[],
    transactions: NetWorthTransaction[],
    baseCurrency: string,
    days = 30
  ): Promise<NetWorthSnapshot[]> {
    const eligibleAccounts = accounts.filter(
      a => a.include_in_net_worth !== false && a.is_active !== false
    )

    const snapshots: NetWorthSnapshot[] = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - i
      )

      const dateStr = d.toISOString().slice(0, 10)

      const label = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      const balances = this.computeHistoricalBalances(
        eligibleAccounts,
        transactions,
        d
      )

      const items = eligibleAccounts.map(a => ({
        amount: balances[a.id] ?? 0,
        currency: a.currency,
      }))

      const converted = await ExchangeRateService.convertBatch(
        items,
        baseCurrency,
        dateStr
      )

      const value = Math.round(
        converted.reduce((sum, v) => sum + v, 0)
      )

      snapshots.push({
        dateStr,
        label,
        value,
      })
    }

    return snapshots
  },

  /**
   * Net worth grouped by account type, normalized to baseCurrency.
   * Used for allocation breakdowns.
   */
  async byAccountType(
    accounts: (NetWorthAccount & { type: string })[],
    baseCurrency: string
  ): Promise<Record<string, number>> {
    const eligible = accounts.filter(
      a => a.include_in_net_worth !== false && a.is_active !== false
    )

    const converted = await ExchangeRateService.convertBatch(
      eligible.map(a => ({
        amount: a.balance,
        currency: a.currency,
      })),
      baseCurrency
    )

    const result: Record<string, number> = {}

    eligible.forEach((a, i) => {
      result[a.type] = (result[a.type] ?? 0) + converted[i]
    })

    return result
  },
}