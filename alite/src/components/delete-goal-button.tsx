'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteGoal } from '@/app/actions/goals'

export default function DeleteGoalButton({ goalId }: { goalId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    startTransition(async () => {
      await deleteGoal(goalId)
      router.push('/goals')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={confirming ? 'Confirm delete goal' : 'Delete goal'}
        className="w-full h-11 rounded-2xl border border-expense/30 text-expense text-sm font-semibold hover:bg-expense/10 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : confirming ? 'Tap again to confirm delete' : 'Delete goal'}
      </button>
      {confirming && !isPending && (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="w-full h-9 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  )
}