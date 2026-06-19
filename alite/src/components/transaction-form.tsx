'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTransaction,
  createTransfer,
  getExchangeRate,
  type TransactionType,
} from '@/app/actions/transactions'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string
  name: string
  currency: string
  type: string
  color?: string
  balance?: number
}

interface Category {
  id: string
  name: string
  type: string
  color?: string
  icon?: string
}

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  baseCurrency: string
  defaultAccountId?: string
  defaultType?: 'income' | 'expense' | 'transfer'
}

type FormMode = 'expense' | 'income' | 'transfer'

const COMMON_CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'MYR', 'TWD', 'THB', 'MYR', 'PHP']

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransactionForm({
  accounts,
  categories,
  baseCurrency,
  defaultAccountId,
  defaultType,
}: TransactionFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Form mode ──
  const [mode, setMode] = useState<FormMode>(defaultType ?? 'expense')

  // ── Shared fields ──
  const firstAccountId = defaultAccountId ?? accounts[0]?.id ?? ''
  const [accountId, setAccountId] = useState(firstAccountId)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(
    accounts.find(a => a.id === firstAccountId)?.currency ?? baseCurrency
  )
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [happenedAt, setHappenedAt] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false)

  // ── Transfer-specific ──
  const secondAccountId = accounts.find(a => a.id !== firstAccountId)?.id ?? ''
  const [toAccountId, setToAccountId] = useState(secondAccountId)
  const [toAmount, setToAmount] = useState('')

  // ── Exchange rate ──
  const [exchangeRate, setExchangeRate] = useState(1)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState('')

  // ── UI ──
  const [error, setError] = useState('')

  // ── Derived ──
  const numAmount = parseFloat(amount || '0')
  const baseCurrencyAmount = parseFloat((numAmount * exchangeRate).toFixed(2))
  const filteredCategories = categories.filter(
    c => c.type === mode || c.type === 'both'
  )
  const toAccount = accounts.find(a => a.id === toAccountId)

  // ── Sync currency when account changes ──
  useEffect(() => {
    const account = accounts.find(a => a.id === accountId)
    if (account) setCurrency(account.currency)
  }, [accountId, accounts])

  // ── Reset category on mode change ──
  useEffect(() => {
    setCategoryId('')
  }, [mode])

  // ── Default toAccountId when mode switches to transfer ──
  useEffect(() => {
    if (mode === 'transfer') {
      const other = accounts.find(a => a.id !== accountId)
      if (other) setToAccountId(other.id)
    }
  }, [mode, accountId, accounts])

  // ── Fetch exchange rate ──
  const fetchRate = useCallback(
    async (from: string, to: string) => {
      if (from === to) {
        setExchangeRate(1)
        setRateError('')
        return
      }
      setRateLoading(true)
      setRateError('')
      const result = await getExchangeRate(from, to)
      if (result.error || result.rate === 0) {
        setRateError(
          result.error ??
            `No rate found for ${from} → ${to}. Conversion may be inaccurate.`
        )
        setExchangeRate(0)
      } else {
        setExchangeRate(result.rate)
      }
      setRateLoading(false)
    },
    []
  )

  useEffect(() => {
    fetchRate(currency, baseCurrency)
  }, [currency, baseCurrency, fetchRate])

  // ── Submit handler ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'transfer') {
      if (!accountId) return setError('Select a source account.')
      if (!toAccountId) return setError('Select a destination account.')
      if (accountId === toAccountId) return setError('Source and destination must differ.')
      if (!numAmount || numAmount <= 0) return setError('Enter a valid amount.')

      const toAmt = toAmount ? parseFloat(toAmount) : numAmount
      if (isNaN(toAmt) || toAmt <= 0) return setError('Enter a valid destination amount.')

      const fromCurrency = accounts.find(a => a.id === accountId)?.currency ?? currency
      const toCurrency = toAccount?.currency ?? fromCurrency

      let rate = 1
      if (fromCurrency !== toCurrency) {
        if (exchangeRate === 0) return setError(rateError || 'Missing exchange rate for this currency pair.')
        rate = exchangeRate
      }

      startTransition(async () => {
        const result = await createTransfer({
          from_account_id: accountId,
          to_account_id: toAccountId,
          from_amount: numAmount,
          to_amount: toAmt,
          from_currency: fromCurrency,
          to_currency: toCurrency,
          exchange_rate: rate,
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
      return
    }

    // income / expense
    if (!numAmount || numAmount <= 0) return setError('Enter a valid amount.')
    if (!accountId) return setError('Select an account.')
    if (!categoryId) return setError('Select a category.')
    if (exchangeRate === 0) {
      return setError(rateError || `Missing exchange rate for ${currency} → ${baseCurrency}. Add it in settings.`)
    }

    startTransition(async () => {
      const result = await createTransaction({
        account_id: accountId,
        type: mode as TransactionType,
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

  const fromAccount = accounts.find(a => a.id === accountId)
  const fromCurrency = fromAccount?.currency ?? currency
  const toCurrency = toAccount?.currency ?? fromCurrency
  const isCrossCurrency = mode === 'transfer' && fromCurrency !== toCurrency

  return (
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* ── Mode toggle ── */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)' }}
      >
        {(['expense', 'income', 'transfer'] as const).map(m => {
          const active = mode === m
          const activeColor =
            m === 'expense' ? 'text-expense' : m === 'income' ? 'text-income' : 'text-[#818cf8]'
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold capitalize transition-all ${
                active ? `bg-card shadow-sm ${activeColor}` : 'text-muted-foreground'
              }`}
            >
              {m === 'transfer' ? '⇄ Transfer' : m}
            </button>
          )
        })}
      </div>

      {/* ── Amount + Currency ── */}
      <div
        className="rounded-2xl px-4 py-4"
        style={{ border: '0.5px solid rgba(255,255,255,0.08)', background: 'var(--card)' }}
      >
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2">
          {mode === 'transfer' ? 'Amount to send' : 'Amount'}
        </label>
        <div className="flex items-center gap-3">
          {mode !== 'transfer' && (
            <button
              type="button"
              onClick={() => setShowCurrencyPicker(p => !p)}
              className="shrink-0 flex items-center gap-1 text-sm font-semibold text-foreground rounded-lg px-2.5 py-1.5 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)' }}
            >
              {currency}
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="text-muted-foreground">
                <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          {mode === 'transfer' && (
            <span
              className="shrink-0 text-sm font-semibold text-muted-foreground rounded-lg px-2.5 py-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
              {fromCurrency}
            </span>
          )}
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-extrabold tabular-nums text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
          />
        </div>

        {/* Currency picker */}
        {showCurrencyPicker && mode !== 'transfer' && (
          <div className="mt-3 pt-3 grid grid-cols-4 gap-1.5" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {COMMON_CURRENCIES.filter((c, i, a) => a.indexOf(c) === i).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { setCurrency(c); setShowCurrencyPicker(false) }}
                className={`text-xs font-semibold rounded-lg py-1.5 transition-colors ${
                  c === currency
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={c !== currency ? { background: 'rgba(255,255,255,0.04)' } : {}}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Rate preview */}
        {mode !== 'transfer' && currency !== baseCurrency && numAmount > 0 && (
          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
            {rateError ? (
              <p className="text-[11px] font-medium text-expense flex items-center gap-1">
                <span>⚠</span> {rateError.split('.')[0]}
              </p>
            ) : rateLoading ? (
              <p className="text-[11px] text-muted-foreground">Fetching rate…</p>
            ) : (
              <>
                <span className="text-[11px] text-muted-foreground">
                  1 {currency} = {exchangeRate} {baseCurrency}
                </span>
                <span className="text-[11px] font-semibold text-foreground tabular-nums">
                  ≈ {formatCurrency(baseCurrencyAmount, baseCurrency)}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Account selection ── */}
      {mode === 'transfer' ? (
        <div
          className="rounded-2xl px-4 py-4 space-y-4"
          style={{ border: '0.5px solid rgba(255,255,255,0.08)', background: 'var(--card)' }}
        >
          {/* From account */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2">
              From
            </label>
            <AccountPicker
              accounts={accounts}
              value={accountId}
              onChange={id => {
                setAccountId(id)
                // ensure toAccount differs
                if (id === toAccountId) {
                  const other = accounts.find(a => a.id !== id)
                  if (other) setToAccountId(other.id)
                }
              }}
              excludeId={toAccountId}
            />
          </div>

          {/* Arrow */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-muted-foreground text-sm">↓</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* To account */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2">
              To
            </label>
            <AccountPicker
              accounts={accounts}
              value={toAccountId}
              onChange={id => {
                setToAccountId(id)
                if (id === accountId) {
                  const other = accounts.find(a => a.id !== id)
                  if (other) setAccountId(other.id)
                }
              }}
              excludeId={accountId}
            />
          </div>

          {/* Cross-currency: destination amount */}
          {isCrossCurrency && (
            <div className="pt-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2">
                Destination amount ({toCurrency})
              </label>
              <input
                type="number"
                inputMode="decimal"
                placeholder={`Amount in ${toCurrency}`}
                value={toAmount}
                onChange={e => setToAmount(e.target.value)}
                className="w-full bg-transparent text-base font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Leave blank to use same amount (for same-currency transfers).
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl px-4 py-4"
          style={{ border: '0.5px solid rgba(255,255,255,0.08)', background: 'var(--card)' }}
        >
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2.5">
            Account
          </label>
          <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
        </div>
      )}

      {/* ── Category (not for transfers) ── */}
      {mode !== 'transfer' && (
        <div
          className="rounded-2xl px-4 py-4"
          style={{ border: '0.5px solid rgba(255,255,255,0.08)', background: 'var(--card)' }}
        >
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2.5">
            Category
          </label>
          {filteredCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No categories for this type.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredCategories.map(cat => {
                const active = categoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className="rounded-xl px-3 py-2 text-xs font-semibold transition-all"
                    style={
                      active
                        ? {
                            background: cat.color ? `${cat.color}22` : mode === 'expense' ? 'rgba(248,113,113,0.12)' : 'rgba(52,211,153,0.12)',
                            color: cat.color ?? (mode === 'expense' ? 'var(--expense)' : 'var(--income)'),
                            border: `0.5px solid ${cat.color ?? (mode === 'expense' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)')}`,
                          }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--muted-foreground)',
                            border: '0.5px solid rgba(255,255,255,0.06)',
                          }
                    }
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Note + Date ── */}
      <div
        className="rounded-2xl px-4 py-4 space-y-4"
        style={{ border: '0.5px solid rgba(255,255,255,0.08)', background: 'var(--card)' }}
      >
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2">
            Note (optional)
          </label>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={120}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] block mb-2">
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

      {/* ── Error ── */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-xs font-medium text-expense"
          style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-[0.98] disabled:opacity-40"
        style={
          mode === 'income'
            ? { background: 'var(--income)', color: '#000' }
            : mode === 'transfer'
            ? { background: 'rgba(129,140,248,1)', color: '#fff' }
            : { background: 'var(--expense)', color: '#fff' }
        }
      >
        {isPending
          ? 'Saving…'
          : mode === 'transfer'
          ? `Transfer ${numAmount > 0 ? formatCurrency(numAmount, fromCurrency) : ''}`
          : `Add ${mode} ${numAmount > 0 ? formatCurrency(numAmount, currency) : ''}`}
      </button>
    </form>
  )
}

// ─── Account Picker sub-component ─────────────────────────────────────────────

function AccountPicker({
  accounts,
  value,
  onChange,
  excludeId,
}: {
  accounts: Account[]
  value: string
  onChange: (id: string) => void
  excludeId?: string
}) {
  const visible = excludeId ? accounts.filter(a => a.id !== excludeId) : accounts

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(account => {
        const active = value === account.id
        return (
          <button
            key={account.id}
            type="button"
            onClick={() => onChange(account.id)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all"
            style={
              active
                ? {
                    background: account.color ? `${account.color}22` : 'rgba(255,255,255,0.08)',
                    color: account.color ?? 'var(--foreground)',
                    border: `0.5px solid ${account.color ?? 'rgba(255,255,255,0.12)'}44`,
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--muted-foreground)',
                    border: '0.5px solid rgba(255,255,255,0.06)',
                  }
            }
          >
            <span
              className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{
                background: active ? (account.color ? `${account.color}44` : 'rgba(255,255,255,0.12)') : 'rgba(255,255,255,0.06)',
                color: active ? (account.color ?? 'var(--foreground)') : 'var(--muted-foreground)',
              }}
            >
              {account.name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[120px]">{account.name}</span>
            <span className="opacity-50 text-[10px]">{account.currency}</span>
          </button>
        )
      })}
    </div>
  )
}