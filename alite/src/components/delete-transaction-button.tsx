'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTransaction, deleteTransfer } from '@/app/actions/transactions'

export default function DeleteTransactionButton({
  transactionId,
  transferId,
  isTransfer,
}: {
  transactionId: string
  transferId: string | null
  isTransfer: boolean
}) {
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
      const result = isTransfer && transferId
        ? await deleteTransfer(transferId)
        : await deleteTransaction(transactionId)

      if (result.error) {
        setError(result.error)
        setConfirming(false)
      } else {
        router.push('/transactions')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={confirming ? 'Confirm delete transaction' : 'Delete transaction'}
        className="w-full h-11 rounded-2xl border border-expense/30 text-expense text-sm font-semibold hover:bg-expense/10 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Deleting…' : confirming ? 'Tap again to confirm delete' : 'Delete transaction'}
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