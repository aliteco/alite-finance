'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory } from '@/app/actions/categories'

const ICONS = ['🏷️', '🍔', '🚗', '🏠', '💡', '🎬', '🛍️', '💊', '📈', '✈️', '🎓', '🐾']
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

export default function CategoryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Give this category a name.'); return }

    startTransition(async () => {
      const result = await createCategory({ name: name.trim(), icon, color, type })
      if (result.error) {
        setError(result.error)
      } else {
        setName('')
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
        className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold tracking-tight transition-all active:scale-[0.98] hover:opacity-90"
      >
        + New category
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-4 space-y-4" noValidate>
      <div>
        <label htmlFor="cat-name" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
          Name
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Pet care"
          maxLength={40}
          autoFocus
          className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>

      <div className="flex bg-muted rounded-xl p-1 gap-1">
        {(['expense', 'income', 'both'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 h-8 rounded-lg text-xs font-semibold capitalize transition-colors
              ${type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Icon</p>
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
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Color</p>
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
      </div>

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
          {isPending ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  )
}