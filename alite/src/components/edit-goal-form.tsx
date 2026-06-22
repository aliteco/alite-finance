// filepath: alite/src/components/edit-goal-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateGoal } from '@/app/actions/goals-edit'

const ICONS = ['🎯', '✈️', '🏠', '🚗', '💍', '🎓', '🏖️', '💰', '🛡️', '📱']
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

interface EditGoalFormProps {
  goalId: string
  initialName: string
  initialDescription: string
  initialTargetAmount: number
  initialTargetDate: string
  initialIcon: string
  initialColor: string
  currency: string
}

export default function EditGoalForm({
  goalId,
  initialName,
  initialDescription,
  initialTargetAmount,
  initialTargetDate,
  initialIcon,
  initialColor,
  currency,
}: EditGoalFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [targetAmount, setTargetAmount] = useState(String(initialTargetAmount))
  const [targetDate, setTargetDate] = useState(initialTargetDate)
  const [icon, setIcon] = useState(initialIcon)
  const [color, setColor] = useState(initialColor)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!name.trim()) { setError('Give this goal a name.'); return }
    const amount = parseFloat(targetAmount)
    if (!amount || amount <= 0) { setError('Enter a valid target amount.'); return }

    startTransition(async () => {
      const result = await updateGoal(goalId, {
        name: name.trim(),
        description: description.trim() || null,
        target_amount: amount,
        target_date: targetDate || null,
        icon,
        color,
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
        <label htmlFor="edit-goal-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Goal name
        </label>
        <input
          id="edit-goal-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={60}
          className="w-full bg-transparent text-base font-medium text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-goal-amount" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Target amount ({currency})
        </label>
        <input
          id="edit-goal-amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={targetAmount}
          onChange={e => setTargetAmount(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold tabular-nums text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-goal-date" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Target date (optional)
        </label>
        <input
          id="edit-goal-date"
          type="date"
          value={targetDate}
          onChange={e => setTargetDate(e.target.value)}
          className="bg-transparent text-sm text-foreground focus:outline-none w-full"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <label htmlFor="edit-goal-description" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Notes (optional)
        </label>
        <input
          id="edit-goal-description"
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={120}
          className="w-full bg-transparent text-sm text-foreground focus:outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl px-4 py-4">
        <fieldset>
          <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2.5">
            Icon
          </legend>
          <div role="radiogroup" aria-label="Icon" className="flex flex-wrap gap-2">
            {ICONS.map(i => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={icon === i}
                onClick={() => setIcon(i)}
                aria-label={`Select icon ${i}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all focus-visible:ring-2
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
          <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
                className="w-8 h-8 rounded-full transition-all focus-visible:ring-2"
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
      {saved && (
        <p role="status" className="text-xs text-income bg-income/10 rounded-xl px-4 py-3 border border-income/20">
          Goal updated.
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