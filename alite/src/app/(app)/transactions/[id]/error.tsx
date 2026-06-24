// filepath: alite/src/app/(app)/transactions/[id]/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function TransactionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Transaction detail error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this transaction"
      message="Your ledger is unaffected. Try again in a moment."
      onRetry={reset}
      secondaryHref="/transactions"
      secondaryLabel="All transactions"
    />
  )
}