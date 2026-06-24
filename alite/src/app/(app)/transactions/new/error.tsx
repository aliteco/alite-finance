// filepath: alite/src/app/(app)/transactions/new/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function NewTransactionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('New transaction error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this form"
      message="Nothing was recorded. Try again in a moment."
      onRetry={reset}
      secondaryHref="/transactions"
      secondaryLabel="All transactions"
    />
  )
}