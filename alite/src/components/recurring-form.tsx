// filepath: alite/src/components/recurring-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { createRecurring } from '@/app/actions/recurring'

interface Account {
  id: string
  name: string
  currency: string
}

interface Category {
  id: string
  name: string
  type: string
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export default function RecurringForm({
  accounts,
  categories,
}: {
  accounts: Account[]
  categories: Category[]
}) {
  const [isPending, startTransition] = useTransition()

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]['value']>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(false)
  const [error, setError] = useState('')

  const account = accounts.find(a => a.id === accountId)
  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid amount.'); return }
    if (!description.trim()) { setError('Give this a description.'); return }
    if (!accountId) { setError('Select an account.'); return }

    startTransition(async () => {
      const result = await createRecurring({
        account_id: accountId,
        category_id: categoryId,
        type,
        amount: numAmount,
        currency: account?.currency ?? 'IDR',
        description: description.trim(),
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        auto_generate: autoGenerate,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>

      <div role="radiogroup" aria-label="Transaction type" className="flex bg-muted rounded-xl p-1 gap-1">
        {(['expense', 'income'] as const).map(t => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => { setType(t); setCategoryId(null) }}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold capitalize transition-colors focus-visible:ring-2
              ${type === t
                ? t === 'expense' ? 'bg-card text-expense shadow-sm' : 'bg-card text-income shadow-sm'
                : 'text-muted-foreground'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="rec-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Amount {account ? `(${account.currency})` : ''}
        </label>
        <input
          id="rec-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="rec-desc" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Description
        </label>
        <input
          id="rec-desc"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g. Rent, Netflix, Salary"
          maxLength={120}
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="rec-account" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Account
        </label>
        <select
          id="rec-account"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground focus:outline-none"
        >
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Category (optional)
        </span>
        <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={categoryId === null}
            onClick={() => setCategoryId(null)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2
              ${categoryId === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            None
          </button>
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={categoryId === cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2
                ${categoryId === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Repeats
        </span>
        <div role="radiogroup" aria-label="Frequency" className="grid grid-cols-3 gap-1.5">
          {FREQUENCIES.map(f => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={frequency === f.value}
              onClick={() => setFrequency(f.value)}
              className={`h-9 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2
                ${frequency === f.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">
        <div>
          <label htmlFor="rec-start" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Start date
          </label>
          <input
            id="rec-start"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground focus:outline-none"
          />
        </div>
        <div className="border-t border-border pt-4">
          <label htmlFor="rec-end" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            End date (optional)
          </label>
          <input
            id="rec-end"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            min={startDate}
            className="w-full bg-transparent text-sm text-foreground focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAutoGenerate(v => !v)}
        aria-pressed={autoGenerate}
        className="w-full bg-card border border-border rounded-2xl px-4 py-4 flex items-center justify-between focus-visible:ring-2"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">Auto-generate</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            A daily server job posts this transaction automatically when due. Turn off to record each cycle manually.
          </p>
        </div>
        <span
          aria-hidden="true"
          className={`shrink-0 w-11 h-6 rounded-full relative transition-colors ml-3 ${autoGenerate ? 'bg-income' : 'bg-muted'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${autoGenerate ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </span>
      </button>

      {error && (
        <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isPending ? 'Creating…' : 'Create recurring transaction'}
      </button>
    </form>
  )
}