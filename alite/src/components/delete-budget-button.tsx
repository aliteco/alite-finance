'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteBudget } from '@/app/actions/transactions'

export default function DeleteBudgetButton({ budgetId }: { budgetId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      return
    }
    setError('')
    startTransition(async () => {
      const result = await deleteBudget(budgetId)
      if (result.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={confirming ? 'Confirm delete budget' : 'Delete budget'}
        className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors shrink-0
          ${confirming ? 'bg-expense text-white' : 'text-muted-foreground hover:text-expense hover:bg-expense/10'}`}
      >
        {isPending ? '…' : confirming ? 'Confirm' : 'Delete'}
      </button>
      {error && (
        <p role="alert" className="text-[10px] text-expense max-w-[140px] text-right">
          {error}
        </p>
      )}
    </div>
  )
}