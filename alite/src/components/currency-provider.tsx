// filepath: alite/src/components/currency-provider.tsx
'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'

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

const STORAGE_KEY = 'alite_display_currency'

export function CurrencyProvider({
  children,
  initialBaseCurrency,
}: {
  children: React.ReactNode
  initialBaseCurrency: string
}) {
  const [displayCurrency, setDisplayCurrencyState] =
    useState<string>(initialBaseCurrency)

  const [mounted, setMounted] = useState(false)
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({})
  const [isLoadingRates, setIsLoadingRates] = useState(true)

  useEffect(() => {
    setMounted(true)

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setDisplayCurrencyState(saved)
    } catch {
      // ignore
    }

    let active = true

    async function loadRates() {
      try {
        const rates = await ClientRateFacade.fetchUsdRates()
        if (active) setExchangeRates(rates)
      } catch (e) {
        console.error('Failed to load exchange rates', e)
      } finally {
        if (active) setIsLoadingRates(false)
      }
    }

    loadRates()

    return () => {
      active = false
    }
  }, [])

  const setDisplayCurrency = useCallback((currency: string) => {
    setDisplayCurrencyState(currency)

    try {
      localStorage.setItem(STORAGE_KEY, currency)
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('alite_display_currency_changed', {
          detail: currency,
        })
      )
    }
  }, [])

  const convert = useCallback(
    (amount: number, from: string, to?: string): number => {
      return ClientRateFacade.convertSync(
        amount,
        from,
        to || displayCurrency,
        exchangeRates
      )
    },
    [displayCurrency, exchangeRates]
  )

  // ✅ FIXED FORMAT FUNCTION (THIS IS THE IMPORTANT PART)
  const format = useCallback(
    (amount: number, currency?: string): string => {
      const currencyCode = currency || displayCurrency
      const symbol =
        CURRENCY_SYMBOLS[currencyCode] || currencyCode

      try {
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)

        return `${symbol} ${formatted}`
      } catch {
        return `${symbol} ${Math.round(amount).toLocaleString()}`
      }
    },
    [displayCurrency]
  )

  const value = useMemo<CurrencyContextType>(
    () => ({
      baseCurrency: initialBaseCurrency,
      displayCurrency: mounted ? displayCurrency : initialBaseCurrency,
      setDisplayCurrency,
      exchangeRates,
      convert,
      format,
      isLoadingRates,
    }),
    [
      initialBaseCurrency,
      mounted,
      displayCurrency,
      setDisplayCurrency,
      exchangeRates,
      convert,
      format,
      isLoadingRates,
    ]
  )

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context)
    throw new Error('useCurrency must be used inside a CurrencyProvider')
  return context
}