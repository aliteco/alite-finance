'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategory } from '@/app/actions/categories'

export default function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setError('')
    startTransition(async () => {
      const result = await deleteCategory(categoryId)
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
        aria-label={confirming ? 'Confirm delete category' : 'Delete category'}
        className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors
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