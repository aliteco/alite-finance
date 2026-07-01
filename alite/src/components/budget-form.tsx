// filepath: alite/src/components/budget-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBudget } from '@/app/actions/transactions'
import { useCurrency } from '@/components/currency-provider'

interface Category {
  id: string
  name: string
  type: string
}

interface BudgetFormProps {
  categories: Category[]
  baseCurrency: string
  existingBudgets?: { category_id: string | null; period: string }[]
}

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export default function BudgetForm({ categories, baseCurrency, existingBudgets = [] }: BudgetFormProps) {
  const router = useRouter()
  const { displayCurrency } = useCurrency()
  const budgetCurrency = displayCurrency || baseCurrency
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  const hasConflict = existingBudgets.some(
    b => b.category_id === categoryId && b.period === period
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Give this budget a name.'); return }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid budget amount.'); return }
    if (!startDate) { setError('Pick a start date.'); return }

    startTransition(async () => {
      const result = await createBudget({
        name: name.trim(),
        amount: numAmount,
        currency: budgetCurrency,
        period,
        category_id: categoryId,
        start_date: startDate,
        end_date: null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/budgets')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="budget-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Budget name
        </label>
        <input
          id="budget-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Groceries"
          maxLength={60}
          required
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          autoFocus
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="budget-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Limit ({budgetCurrency})
        </label>
        <input
          id="budget-amount"
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
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Resets
        </span>
        <div role="radiogroup" aria-label="Budget period" className="flex bg-muted rounded-xl p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2
                ${period === p.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="budget-start" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Start date
        </label>
        <input
          id="budget-start"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Category
        </span>
        <div role="radiogroup" aria-label="Budget category" className="flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={categoryId === null}
            onClick={() => setCategoryId(null)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2
              ${categoryId === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
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
                ${categoryId === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {expenseCategories.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            No expense categories found — this budget will track all expense spending.
          </p>
        )}
      </div>

      {hasConflict && (
        <p role="status" className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl px-4 py-3 border border-amber-500/20">
          You already have a {period} budget for this category. Creating another will track separately — consider editing the existing one instead.
        </p>
      )}

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
        {isPending ? 'Creating…' : 'Create budget'}
      </button>
    </form>
  )
}