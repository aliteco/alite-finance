'use client'

import { useState, useTransition } from 'react'
import { createGoal } from '@/app/actions/goals'

const ICONS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '🏖️', '💰', '🛡️', '📱']
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

interface GoalFormProps {
  baseCurrency: string
}

export default function GoalForm({ baseCurrency }: GoalFormProps) {
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Give this goal a name.'); return }
    const amount = parseFloat(targetAmount)
    if (!amount || amount <= 0) { setError('Enter a valid target amount.'); return }

    startTransition(async () => {
      const result = await createGoal({
        name: name.trim(),
        description: description.trim() || null,
        target_amount: amount,
        currency: baseCurrency,
        target_date: targetDate || null,
        icon,
        color,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="goal-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Goal name
        </label>
        <input
          id="goal-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Emergency fund"
          maxLength={60}
          required
          autoFocus
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="goal-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Target amount ({baseCurrency})
        </label>
        <input
          id="goal-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="0"
          value={targetAmount}
          onChange={e => setTargetAmount(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="goal-date" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Target date (optional)
        </label>
        <input
          id="goal-date"
          type="date"
          value={targetDate}
          onChange={e => setTargetDate(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="bg-transparent text-sm text-foreground focus:outline-none w-full"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="goal-description" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Notes (optional)
        </label>
        <input
          id="goal-description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What's this for?"
          maxLength={120}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <fieldset>
          <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Icon
          </legend>
          <div className="flex flex-wrap gap-2">
            {ICONS.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                aria-pressed={icon === i}
                aria-label={`Select icon ${i}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all
                  ${icon === i ? 'bg-primary/15 ring-2 ring-primary' : 'bg-muted hover:bg-muted-foreground/10'}`}
              >
                {i}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <fieldset>
          <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Color
          </legend>
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                aria-label={`Select color ${c}`}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: c,
                  outline: color === c ? '2px solid var(--foreground)' : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </fieldset>
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
        {isPending ? 'Creating…' : 'Create goal'}
      </button>
    </form>
  )
}