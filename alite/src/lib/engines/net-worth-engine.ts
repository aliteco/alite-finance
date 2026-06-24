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

export const NetWorthEngine = {
  /**
   * Sums account balances normalized into baseCurrency.
   * This is what generates your "Net Worth" header.
   */
  async currentNetWorth(
    accounts: NetWorthAccount[],
    baseCurrency: string
  ): Promise<number> {
    const eligible = accounts.filter(
      a => a.include_in_net_worth !== false && a.is_active !== false
    )

    if (eligible.length === 0) return 0

    // Batch convert all accounts to the base currency (e.g., IDR)
    const convertedValues = await ExchangeRateService.convertBatch(
      eligible.map(a => ({
        amount: a.balance,
        currency: a.currency,
      })),
      baseCurrency
    )

    // Sum the converted values
    return convertedValues.reduce((sum, v) => sum + v, 0)
  },

  /**
   * Reconstructs historical balances. 
   * Useful for the Net Worth Chart.
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
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const balances = this.computeHistoricalBalances(eligibleAccounts, transactions, d)

      const items = eligibleAccounts.map(a => ({
        amount: balances[a.id] ?? 0,
        currency: a.currency,
      }))

      const converted = await ExchangeRateService.convertBatch(items, baseCurrency, dateStr)
      const value = Math.round(converted.reduce((sum, v) => sum + v, 0))

      snapshots.push({ dateStr, label, value })
    }

    return snapshots
  },
}