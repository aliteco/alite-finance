// filepath: alite/src/components/dashboard/date-range-picker.tsx
'use client'

import { useState, useRef, useEffect, useId } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

export interface CustomRange {
  start: string // ISO date yyyy-mm-dd
  end: string
}

interface DateRangePickerProps {
  value: CustomRange | null
  onChange: (range: CustomRange | null) => void
  onClose?: () => void
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [start, setStart] = useState(value?.start ?? '')
  const [end, setEnd] = useState(value?.end ?? todayStr())
  const [error, setError] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const startId = useId()
  const endId = useId()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleApply() {
    setError('')
    if (!start || !end) {
      setError('Pick both a start and end date.')
      return
    }
    if (new Date(start) > new Date(end)) {
      setError('Start date must be before end date.')
      return
    }
    onChange({ start, end })
    setIsOpen(false)
  }

  function handleClear() {
    setStart('')
    setEnd(todayStr())
    setError('')
    onChange(null)
    setIsOpen(false)
  }

  const label = value
    ? `${new Date(value.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(
        value.end
      ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'Custom'

  return (
    <div className="relative inline-block shrink-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all focus-visible:ring-2 ${
          value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Calendar size={13} aria-hidden="true" />
        {label}
        <ChevronDown size={11} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Custom date range"
          className="absolute right-0 top-full mt-2 z-50 w-72 bg-card border border-border rounded-2xl shadow-xl p-4"
        >
          <div>
            <label htmlFor={startId} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Start date
            </label>
            <input
              id={startId}
              type="date"
              value={start}
              max={end || todayStr()}
              onChange={e => setStart(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor={endId} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              End date
            </label>
            <input
              id={endId}
              type="date"
              value={end}
              min={start}
              max={todayStr()}
              onChange={e => setEnd(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {error && (
            <p role="alert" className="text-[11px] text-expense bg-expense/10 rounded-lg px-2.5 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 h-9 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}