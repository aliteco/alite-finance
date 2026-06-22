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
]

const COMMON_CURRENCIES = [
  'IDR', 'USD', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'MYR', 'TWD'
]

interface AccountFormProps {
  initialCurrency: string
}

export default function AccountForm({ initialCurrency }: AccountFormProps) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [currency, setCurrency] = useState(initialCurrency)
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')

  const allowsNegativeBalance = type === 'credit_card'

  async function handleSubmit(e: React.SubmitEvent) {
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
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Account name
        </label>

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. BCA Checking"
          maxLength={60}
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      {/* Type */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Type
        </label>

        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
        >
          {ACCOUNT_TYPES.map(t => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Currency + Balance */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">

        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Currency
          </label>

          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm"
          >
            {COMMON_CURRENCIES.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-border pt-4">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Starting balance
          </label>

          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-2xl font-bold tabular-nums"
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
        <p role="alert" className="text-xs text-red-500 bg-red-500/10 p-3 rounded-xl">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold"
      >
        {isPending ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}