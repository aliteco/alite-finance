// filepath: alite/src/components/edit-transaction-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTransactionDetails } from '@/app/actions/transactions-edit'

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

interface TxInitial {
  id: string
  type: 'income' | 'expense'
  amount: number
  account_id: string
  category_id: string
  description: string
  date: string
}

export default function EditTransactionForm({
  transaction,
  accounts,
  categories,
}: {
  transaction: TxInitial
  accounts: Account[]
  categories: Category[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [categoryId, setCategoryId] = useState(transaction.category_id)
  const [description, setDescription] = useState(transaction.description)
  const [date, setDate] = useState(transaction.date)
  const [error, setError] = useState('')

  const filteredCategories = categories.filter(c => c.type === transaction.type || c.type === 'both')
  const account = accounts.find(a => a.id === transaction.account_id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!categoryId) { setError('Select a category.'); return }

    startTransition(async () => {
      const result = await updateTransactionDetails(transaction.id, {
        category_id: categoryId,
        description,
        date,
      })
      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/transactions/${transaction.id}`)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
          Amount &amp; account
        </p>
        <p className="text-xs text-muted-foreground">
          {transaction.amount.toLocaleString()} {account?.currency} via {account?.name} — not editable here.
          To change the amount, delete and recreate this transaction.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
          Category
        </span>
        <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-2">
          {filteredCategories.map(cat => (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={categoryId === cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2
                ${categoryId === cat.id
                  ? transaction.type === 'expense' ? 'bg-expense/15 text-expense' : 'bg-income/15 text-income'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4 space-y-4">
        <div>
          <label htmlFor="edit-tx-note" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Note
          </label>
          <input
            id="edit-tx-note"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={120}
            className="w-full bg-transparent text-sm text-foreground focus:outline-none"
          />
        </div>
        <div className="border-t border-border pt-4">
          <label htmlFor="edit-tx-date" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            Date
          </label>
          <input
            id="edit-tx-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="w-full bg-transparent text-sm text-foreground focus:outline-none"
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
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isPending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}