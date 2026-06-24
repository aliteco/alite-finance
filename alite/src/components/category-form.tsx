'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory } from '@/app/actions/categories'
import { renderCategoryIcon } from '@/lib/icons'
import { Plus, X } from 'lucide-react'

const ICONS = [
  'shopping-bag',
  'utensils',
  'car',
  'home',
  'zap',
  'tv',
  'gift',
  'heart-pulse',
  'laptop',
  'plane',
  'graduation-cap',
  'briefcase',
] as const

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
]

export default function CategoryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<string>(ICONS[0])
  const [color, setColor] = useState(COLORS[0])
  const [type, setType] = useState<'income' | 'expense' | 'both'>('expense')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Give this category a name.')
      return
    }

    startTransition(async () => {
      const result = await createCategory({
        name: name.trim(),
        icon,
        color,
        type,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      setName('')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-11 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
      >
        <Plus size={14} strokeWidth={2.5} />
        <span>New custom category</span>
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-sm animate-in fade-in-50 duration-150"
      noValidate
    >
      {/* Structural Preview & Input Block */}
      <div className="space-y-1.5">
        <label htmlFor="catName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">
          Category Name
        </label>
        <div className="flex items-center gap-3 w-full bg-muted/20 border border-border rounded-xl px-3.5 h-11 focus-within:border-foreground/40 focus-within:bg-card transition-all">
          <div 
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
            style={{ color: color }}
          >
            {renderCategoryIcon(icon, 'Preview', 'w-4 h-4')}
          </div>
          <input
            id="catName"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Subscriptions, Groceries..."
            maxLength={40}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
        </div>
      </div>

      {/* Segmented Flow Type Control */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block px-0.5">
          Flow Assignment
        </span>
        <div className="flex bg-muted/60 p-1 rounded-xl border border-border/40 gap-1">
          {(['expense', 'income', 'both'] as const).map(t => {
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 h-8 rounded-lg text-xs font-semibold capitalize transition-all duration-100 active:scale-[0.98]
                  ${active 
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm font-bold' 
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Icon Panel */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">
          Glyph Selection
        </p>
        <div className="grid grid-cols-6 gap-1.5 bg-muted/10 border border-border/40 p-2 rounded-xl max-h-36 overflow-y-auto">
          {ICONS.map(i => {
            const active = icon === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                aria-pressed={active}
                aria-label={`Select icon ${i}`}
                className={`aspect-square rounded-lg flex items-center justify-center transition-all active:scale-95
                  ${active
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm scale-105'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border-strong'
                  }`}
              >
                <span style={{ color: active ? undefined : color }} className="transition-colors">
                  {renderCategoryIcon(i, 'Category Option', 'w-4 h-4')}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Matrix Color Panel */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-0.5">
          Theme Identity
        </p>
        <div className="flex flex-wrap gap-2.5 p-1">
          {COLORS.map(c => {
            const active = color === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={active}
                className={`w-7 h-7 rounded-full transition-all relative active:scale-90 shadow-inner
                  ${active ? 'ring-2 ring-offset-2 ring-foreground dark:ring-offset-neutral-900 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: c }}
              />
            )
          })}
        </div>
      </div>

      {/* System Error Alerts */}
      {error && (
        <p role="alert" className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl outline-none">
          {error}
        </p>
      )}

      {/* Interactive Action Blocks */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError('')
          }}
          className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all active:scale-[0.98]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold disabled:opacity-40 transition-all active:scale-[0.98]"
        >
          {isPending ? 'Creating…' : 'Create category'}
        </button>
      </div>
    </form>
  )
}