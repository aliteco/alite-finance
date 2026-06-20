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

const COMMON_CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'MYR', 'TWD']

interface AccountFormProps {
  defaultCurrency: string
}

export default function AccountForm({ defaultCurrency }: AccountFormProps) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [balance, setBalance] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Give your account a name.'); return }
    const numBalance = parseFloat(balance || '0')
    if (Number.isNaN(numBalance)) { setError('Enter a valid starting balance.'); return }
    if (numBalance < 0) { setError('Opening balance cannot be negative.'); return }

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
          name="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. BCA Checking"
          maxLength={60}
          required
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Type */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="account-type" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Type
        </label>
        <select
          id="account-type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Currency + starting balance */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">
        <div>
          <label htmlFor="account-currency" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Currency
          </label>
          <select
            id="account-currency"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none"
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-border pt-4">
          <label htmlFor="account-balance" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Starting balance
          </label>
          <input
            id="account-balance"
            name="balance"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0"
            value={balance}
            onChange={e => setBalance(e.target.value)}
            className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}