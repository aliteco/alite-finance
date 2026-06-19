'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBudget } from '@/app/actions/transactions'

interface Category {
  id: string
  name: string
  type: string
}

interface BudgetFormProps {
  categories: Category[]
  baseCurrency: string
}

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export default function BudgetForm({ categories, baseCurrency }: BudgetFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Give this budget a name.'); return }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid budget amount.'); return }

    startTransition(async () => {
      const result = await createBudget({
        name: name.trim(),
        amount: numAmount,
        currency: baseCurrency,
        period,
        category_id: categoryId,
        start_date: new Date().toISOString().slice(0, 10),
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
    <form onSubmit={handleSubmit} className="space-y-3">

      {/* Name */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Budget name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Groceries"
          maxLength={60}
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Amount */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Limit ({baseCurrency})
        </label>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      {/* Period */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Resets
        </label>
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors
                ${period === p.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors
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
              onClick={() => setCategoryId(cat.id)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors
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

      {error && (
        <p className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? 'Creating…' : 'Create budget'}
      </button>
    </form>
  )
}