// filepath: alite/src/components/edit-budget-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudget } from '@/app/actions/transactions'

interface Category {
  id: string
  name: string
  type: string
}

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export default function EditBudgetForm({
  budgetId,
  initialName,
  initialAmount,
  initialPeriod,
  initialCategoryId,
  initialEndDate,
  categories,
}: {
  budgetId: string
  initialName: string
  initialAmount: number
  initialPeriod: 'weekly' | 'monthly' | 'yearly'
  initialCategoryId: string | null
  initialEndDate: string | null
  categories: Category[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialName)
  const [amount, setAmount] = useState(String(initialAmount))
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>(initialPeriod)
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId)
  const [endDate, setEndDate] = useState(initialEndDate ?? '')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!name.trim()) { setError('Give this budget a name.'); return }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid budget amount.'); return }

    startTransition(async () => {
      const result = await updateBudget(budgetId, {
        name: name.trim(),
        amount: numAmount,
        period,
        category_id: categoryId,
        end_date: endDate || null,
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
        <label htmlFor="edit-budget-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Budget name
        </label>
        <input
          id="edit-budget-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          className="w-full bg-transparent text-base font-medium text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-budget-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Limit
        </label>
        <input
          id="edit-budget-amount"
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
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">Resets</span>
        <div role="radiogroup" aria-label="Budget period" className="flex bg-muted rounded-xl p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2
                ${period === p.value ? 'bg-selected-bg text-selected-fg shadow-sm' : 'text-muted-foreground'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">Category</span>
        <div role="radiogroup" aria-label="Budget category" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={categoryId === null}
            onClick={() => setCategoryId(null)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2
              ${categoryId === null ? 'bg-selected-bg text-selected-fg' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            All categories
          </button>
          {expenseCategories.map(cat => (
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
        <label htmlFor="edit-budget-end" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          End date (optional)
        </label>
        <input
          id="edit-budget-end"
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground focus:outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-xs text-income bg-income/10 rounded-xl px-4 py-3 border border-income/20">
          Budget updated.
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