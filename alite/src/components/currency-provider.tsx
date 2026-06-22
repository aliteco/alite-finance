// filepath: /src/components/currency-provider.tsx
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { ExchangeRateService, CURRENCY_SYMBOLS } from '@/lib/finance-engine'

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
      const saved = localStorage.getItem('alite_display_currency')
      return saved || initialBaseCurrency
    }
    return initialBaseCurrency
  })
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(true)

  // Load user selected display currency preference from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = localStorage.getItem('alite_display_currency')
      if (saved) {
        setDisplayCurrencyState(saved)
      } else {
        setDisplayCurrencyState(initialBaseCurrency)
      }
    }, 0)

    // Load live exchange rates once on mount
    async function loadRates() {
      try {
        const rates = await ExchangeRateService.fetchLiveRates()
        setExchangeRates(rates)
      } catch (e) {
        console.error('Failed to load exchange rates in workspace', e)
      } finally {
        setIsLoadingRates(false)
      }
    }
    loadRates()

    return () => clearTimeout(timer)
  }, [initialBaseCurrency])

  const setDisplayCurrency = (currency: string) => {
    setDisplayCurrencyState(currency)
    localStorage.setItem('alite_display_currency', currency)
  }

  /**
   * Converts amount from original currency to target currency (defaults to currently selected Display Currency)
   */
  const convert = (amount: number, from: string, to?: string): number => {
    const targetCurrency = to || displayCurrency
    return ExchangeRateService.convertSync(amount, from, targetCurrency, exchangeRates)
  }

  /**
   * Formats a quantity beautifully. If currency is omitted, uses chosen Display Currency.
   */
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
  if (!context) {
    throw new Error('useCurrency must be used inside a CurrencyProvider')
  }
  return context
}
