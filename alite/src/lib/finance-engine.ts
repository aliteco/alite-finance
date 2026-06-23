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