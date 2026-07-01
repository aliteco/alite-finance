// filepath: alite/src/components/account-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { createAccount } from '@/app/actions/transactions'

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
] as const

const COMMON_CURRENCIES = [
  'IDR', 'USD', 'EUR', 'TWD', 'JPY', 'SGD', 'GBP',
  'AUD', 'CNY', 'HKD', 'KRW', 'MYR', 'THB', 'PHP', 'VND',
]

interface AccountFormProps {
  initialCurrency: string
}

export default function AccountForm({ initialCurrency }: AccountFormProps) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [type, setType] = useState<string>('bank')
  const [currency, setCurrency] = useState(initialCurrency)
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')

  const allowsNegativeBalance = type === 'credit_card'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Give your account a name.')
      return
    }

    const numBalance = parseFloat(balance || '0')

    if (Number.isNaN(numBalance)) {
      setError('Enter a valid starting balance.')
      return
    }

    if (numBalance < 0 && !allowsNegativeBalance) {
      setError('Opening balance cannot be negative for this account type.')
      return
    }

    startTransition(async () => {
      const result = await createAccount({
        name: name.trim(),
        type,
        currency,
        balance: numBalance,
      })

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>

      {/* Name */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="account-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Account name
        </label>
        <input
          id="account-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. BCA Checking"
          maxLength={60}
          autoFocus
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* Type */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span id="account-type-label" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Type
        </span>
        <div role="radiogroup" aria-labelledby="account-type-label" className="flex flex-wrap gap-2">
          {ACCOUNT_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={type === t.value}
              onClick={() => setType(t.value)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 border ${
                type === t.value
                  ? 'bg-selected-bg border-selected-border text-selected-fg font-bold'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Currency + Balance */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">

        <div>
          <label htmlFor="account-currency" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Currency
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_CURRENCIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`rounded-xl px-3 py-2 text-xs font-medium transition-all focus-visible:ring-2 border ${
                  currency === c
                    ? 'bg-selected-bg border-selected-border text-selected-fg font-bold'
                    : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label htmlFor="account-balance" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Starting balance
          </label>
          <input
            id="account-balance"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />

          {allowsNegativeBalance && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Negative balance allowed for credit cards.
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p role="alert" aria-live="assertive" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isPending ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}