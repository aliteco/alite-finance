// filepath: alite/src/components/edit-recurring-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateRecurring } from '@/app/actions/recurring'

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

interface EditRecurringFormProps {
  recurringId: string
  initialAmount: number
  initialDescription: string
  initialFrequency: typeof FREQUENCIES[number]['value']
  initialCategoryId: string | null
  initialEndDate: string | null
  initialAutoGenerate: boolean
  currency: string
  categories: Category[]
  transactionType: 'income' | 'expense'
}

export default function EditRecurringForm({
  recurringId,
  initialAmount,
  initialDescription,
  initialFrequency,
  initialCategoryId,
  initialEndDate,
  initialAutoGenerate,
  currency,
  categories,
  transactionType,
}: EditRecurringFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [amount, setAmount] = useState(String(initialAmount))
  const [description, setDescription] = useState(initialDescription)
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]['value']>(initialFrequency)
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId)
  const [endDate, setEndDate] = useState(initialEndDate ?? '')
  const [autoGenerate, setAutoGenerate] = useState(initialAutoGenerate)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const filteredCategories = categories.filter(c => c.type === transactionType || c.type === 'both')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid amount.'); return }
    if (!description.trim()) { setError('Give this a description.'); return }

    startTransition(async () => {
      const result = await updateRecurring(recurringId, {
        amount: numAmount,
        description: description.trim(),
        frequency,
        category_id: categoryId,
        end_date: endDate || null,
        auto_generate: autoGenerate,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-rec-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Amount ({currency})
        </label>
        <input
          id="edit-rec-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-rec-desc" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Description
        </label>
        <input
          id="edit-rec-desc"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={120}
          className="w-full bg-transparent text-base font-medium text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Category
        </span>
        <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={categoryId === null}
            onClick={() => setCategoryId(null)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2
              ${categoryId === null ? 'bg-selected-bg text-selected-fg' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
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
                ${categoryId === cat.id ? 'bg-selected-bg text-selected-fg' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
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
                ${frequency === f.value ? 'bg-selected-bg text-selected-fg' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          Changing frequency affects future occurrences only; the next due date is unchanged.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-rec-end" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          End date (optional)
        </label>
        <input
          id="edit-rec-end"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground focus:outline-none"
        />
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
            A daily scheduled job posts this transaction automatically when due.
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
      {saved && (
        <p role="status" className="text-xs text-income bg-income/10 rounded-xl px-4 py-3 border border-income/20">
          Recurring rule updated.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}