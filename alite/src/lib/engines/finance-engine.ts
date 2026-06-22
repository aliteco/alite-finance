// filepath: alite/src/lib/finance-engine.ts

export type { CurrencyCode } from '@/lib/services/currency-types'
export { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'

import { ClientRateFacade } from '@/lib/services/exchange-rate-client'
import { NetWorthEngine as RealNetWorthEngine } from '@/lib/engines/net-worth-engine'
import { InsightsEngine as RealInsightsEngine } from '@/lib/engines/legacy-insights-adapter'

export interface Account {
  id: string
  name: string
  currency: string
  balance: number
  type: string
  color?: string
}

export interface Transaction {
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
  categories: { id: string; name: string; color: string | null; icon: string | null } | null
  accounts: { id: string; name: string; currency: string; type: string } | null
}

export interface Budget {
  id: string
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  is_active: boolean
  category_id: string | null
  categories: { id: string; name: string; color: string | null; icon: string | null } | null
}

export const ExchangeRateService = {
  fetchLiveRates: () => ClientRateFacade.fetchUsdRates(),
  convertSync: (amount: number, from: string, to: string, customRates?: Record<string, number>) =>
    ClientRateFacade.convertSync(amount, from, to, customRates),
  async getRate(from: string, to: string): Promise<number> {
    const rates = await ClientRateFacade.fetchUsdRates()
    return ClientRateFacade.convertSync(1, from, to, rates)
  },
  async convert(amount: number, from: string, to: string): Promise<number> {
    const rates = await ClientRateFacade.fetchUsdRates()
    return ClientRateFacade.convertSync(amount, from, to, rates)
  },
}

export const NetWorthEngine = RealNetWorthEngine
export const InsightsEngine = RealInsightsEngine