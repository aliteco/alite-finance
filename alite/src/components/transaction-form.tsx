'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTransaction,
  getExchangeRate,
  type TransactionType,
} from '@/app/actions/transactions'

interface Account {
  id: string
  name: string
  currency: string
  type: string
}

interface Category {
  id: string
  name: string
  type: string
}

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  baseCurrency: string
  defaultAccountId?: string
}

const COMMON_CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'MYR']

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default function TransactionForm({
  accounts,
  categories,
  baseCurrency,
  defaultAccountId,
}: TransactionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [type, setType] = useState<TransactionType>('expense')
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(
    accounts.find(a => a.id === (defaultAccountId ?? accounts[0]?.id))?.currency ?? baseCurrency
  )
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [happenedAt, setHappenedAt] = useState(
    new Date().toISOString().slice(0, 10)
  )

  // Rate state
  const [exchangeRate, setExchangeRate] = useState(1)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState('')

  // UI state
  const [error, setError] = useState('')
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  // Derived
  const baseCurrencyAmount = parseFloat(
    (parseFloat(amount || '0') * exchangeRate).toFixed(2)
  )
  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both')
  const selectedAccount = accounts.find(a => a.id === accountId)

  // Fetch rate when currency or baseCurrency changes
  const fetchRate = useCallback(async (from: string, to: string) => {
    if (from === to) { setExchangeRate(1); return }
    setRateLoading(true)
    setRateError('')
    const result = await getExchangeRate(from, to)
    if (result.error) setRateError(result.error)
    setExchangeRate(result.rate)
    setRateLoading(false)
  }, [])

  useEffect(() => {
    fetchRate(currency, baseCurrency)
  }, [currency, baseCurrency, fetchRate])

  // When account changes, sync currency to account's currency
  useEffect(() => {
    const account = accounts.find(a => a.id === accountId)
    if (account) setCurrency(account.currency)
  }, [accountId, accounts])

  // Reset category when type changes
  useEffect(() => {
    setCategoryId('')
  }, [type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid amount.'); return }
    if (!accountId) { setError('Select an account.'); return }
    if (!categoryId) { setError('Select a category.'); return }

    startTransition(async () => {
      const result = await createTransaction({
        account_id: accountId,
        type,
        amount: numAmount,
        currency,
        exchange_rate_used: exchangeRate,
        base_currency_amount: baseCurrencyAmount,
        category_id: categoryId,
        description,
        happened_at: happenedAt,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/transactions')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Type toggle */}
      <div className="flex bg-muted rounded-xl p-1">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold tracking-wide capitalize transition-all
              ${type === t
                ? t === 'expense'
                  ? 'bg-card text-expense shadow-sm'
                  : 'bg-card text-income shadow-sm'
                : 'text-muted-foreground'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount + Currency */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Amount
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCurrencyPicker(p => !p)}
            className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-foreground bg-muted rounded-lg px-2.5 py-1.5 hover:bg-muted/80 transition-colors"
          >
            {currency}
            <span className="text-muted-foreground text-xs">▾</span>
          </button>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
          />
        </div>

        {/* Currency picker dropdown */}
        {showCurrencyPicker && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-1.5">
            {COMMON_CURRENCIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { setCurrency(c); setShowCurrencyPicker(false) }}
                className={`text-xs font-medium rounded-lg py-1.5 transition-colors
                  ${c === currency
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Base currency conversion preview */}
        {currency !== baseCurrency && parseFloat(amount) > 0 && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {rateLoading ? 'Fetching rate…' : rateError ? '⚠ Rate unavailable' : `1 ${currency} = ${exchangeRate} ${baseCurrency}`}
            </span>
            <span className="text-[11px] font-semibold text-foreground tabular-nums">
              ≈ {formatCurrency(baseCurrencyAmount, baseCurrency)}
            </span>
          </div>
        )}
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Account
        </label>
        <div className="flex flex-wrap gap-2">
          {accounts.map(account => (
            <button
              key={account.id}
              type="button"
              onClick={() => setAccountId(account.id)}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors
                ${accountId === account.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              <span className="w-4 h-4 rounded-md bg-current/10 flex items-center justify-center text-[9px] font-bold">
                {account.name.charAt(0)}
              </span>
              {account.name}
              <span className="opacity-60">{account.currency}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Category
        </label>
        {filteredCategories.length === 0 ? (
          <p className="text-xs text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredCategories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors
                  ${categoryId === cat.id
                    ? type === 'expense'
                      ? 'bg-expense/15 text-expense'
                      : 'bg-income/15 text-income'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description + Date */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={120}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          />
        </div>
        <div className="border-t border-border pt-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Date
          </label>
          <input
            type="date"
            value={happenedAt}
            onChange={e => setHappenedAt(e.target.value)}
            className="bg-transparent text-sm text-foreground focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className={`w-full h-12 rounded-2xl text-sm font-semibold tracking-tight transition-all
          active:scale-[0.98] disabled:opacity-50
          ${type === 'expense'
            ? 'bg-expense text-white'
            : 'bg-income text-white'
          }`}
      >
        {isPending
          ? 'Saving…'
          : `Add ${type} ${amount ? formatCurrency(parseFloat(amount) || 0, currency) : ''}`
        }
      </button>
    </form>
  )
}