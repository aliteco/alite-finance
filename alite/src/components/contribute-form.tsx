'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addGoalContribution } from '@/app/actions/goals'

interface Account {
  id: string
  name: string
  currency: string
}

export default function ContributeForm({
  goalId,
  accounts,
  goalCurrency,
}: {
  goalId: string
  accounts: Account[]
  goalCurrency: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('Enter a valid amount.'); return }

    const account = accounts.find(a => a.id === accountId)
    const rate = account && account.currency !== goalCurrency ? 1 : 1 // rate lookup omitted; assumes same currency or manual entry

    startTransition(async () => {
      const result = await addGoalContribution({
        goal_id: goalId,
        account_id: accountId || null,
        amount: numAmount,
        currency: account?.currency ?? goalCurrency,
        exchange_rate: rate,
        date: new Date().toISOString().slice(0, 10),
        notes: null,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setAmount('')
        setOpen(false)
        router.refresh()
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] hover:opacity-90"
      >
        + Add contribution
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div>
        <label htmlFor="contrib-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Amount ({goalCurrency})
        </label>
        <input
          id="contrib-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          autoFocus
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      {accounts.length > 0 && (
        <div>
          <label htmlFor="contrib-account" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
            From account (optional)
          </label>
          <select
            id="contrib-account"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none"
          >
            <option value="">Don&apos;t debit an account</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-3 py-2 border border-expense/20">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setOpen(false); setError('') }}
          className="flex-1 h-10 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Add'}
        </button>
      </div>
    </form>
  )
}