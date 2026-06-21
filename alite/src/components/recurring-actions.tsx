'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateRecurringNow, pauseRecurring } from '@/app/actions/recurring'

export default function RecurringActions({
  id,
  isActive,
}: {
  id: string
  isActive: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleRecordNow() {
    setError('')
    startTransition(async () => {
      const result = await generateRecurringNow(id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleToggle() {
    setError('')
    startTransition(async () => {
      const result = await pauseRecurring(id, !isActive)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
      <div className="flex gap-1">
        {isActive && (
          <button
            type="button"
            onClick={handleRecordNow}
            disabled={isPending}
            className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
            aria-label="Record this transaction now"
          >
            {isPending ? '…' : 'Record'}
          </button>
        )}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          aria-label={isActive ? 'Pause this recurring transaction' : 'Resume this recurring transaction'}
        >
          {isActive ? 'Pause' : 'Resume'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-[10px] text-expense max-w-[140px] text-right">
          {error}
        </p>
      )}
    </div>
  )
}