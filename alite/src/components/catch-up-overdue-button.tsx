'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateAllOverdueRecurring } from '@/app/actions/recurring-batch'

export default function CatchUpOverdueButton({ overdueCount }: { overdueCount: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ processed: number; failed: number } | null>(null)

  if (overdueCount === 0) return null

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const res = await generateAllOverdueRecurring()
      setResult({ processed: res.processed, failed: res.failed })
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-full h-11 rounded-2xl bg-expense/10 border border-expense/25 text-expense text-xs font-semibold hover:bg-expense/15 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isPending
          ? 'Posting overdue transactions…'
          : `Catch up ${overdueCount} overdue rule${overdueCount !== 1 ? 's' : ''}`}
      </button>
      {result && (
        <p role="status" className="text-[11px] text-center text-muted-foreground">
          Posted {result.processed} transaction{result.processed !== 1 ? 's' : ''}
          {result.failed > 0 ? `, ${result.failed} failed` : ''}.
        </p>
      )}
    </div>
  )
}