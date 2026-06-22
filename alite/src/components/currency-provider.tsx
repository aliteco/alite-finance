'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { ClientRateFacade } from '@/lib/services/exchange-rate-client'
import { CURRENCY_SYMBOLS } from '@/lib/finance-engine'

interface CurrencyContextType {
  baseCurrency: string
  displayCurrency: string
  setDisplayCurrency: (currency: string) => void
  exchangeRates: Record<string, number>
  convert: (amount: number, from: string, to?: string) => number
  format: (amount: number, currency?: string) => string
  isLoadingRates: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({
  children,
  initialBaseCurrency,
}: {
  children: React.ReactNode
  initialBaseCurrency: string
}) {
  const [displayCurrency, setDisplayCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alite_display_currency') || initialBaseCurrency
    }
    return initialBaseCurrency
  })

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('alite_display_currency')
    if (saved) setDisplayCurrencyState(saved)

    async function loadRates() {
      try {
        const rates = await ClientRateFacade.fetchUsdRates()
        setExchangeRates(rates)
      } catch (e) {
        console.error('Failed to load exchange rates', e)
      } finally {
        setIsLoadingRates(false)
      }
    }

    loadRates()
  }, [initialBaseCurrency])

  const setDisplayCurrency = (currency: string) => {
    setDisplayCurrencyState(currency)
    localStorage.setItem('alite_display_currency', currency)
  }

  const convert = (amount: number, from: string, to?: string): number => {
    return ClientRateFacade.convertSync(amount, from, to || displayCurrency, exchangeRates)
  }

  const format = (amount: number, currency?: string): string => {
    const currencyCode = currency || displayCurrency
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    } catch {
      return `${symbol} ${Math.round(amount).toLocaleString()}`
    }
  }

  return (
    <CurrencyContext.Provider
      value={{
        baseCurrency: initialBaseCurrency,
        displayCurrency,
        setDisplayCurrency,
        exchangeRates,
        convert,
        format,
        isLoadingRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) throw new Error('useCurrency must be used inside a CurrencyProvider')
  return context
}