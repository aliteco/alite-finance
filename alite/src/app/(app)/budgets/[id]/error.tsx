// filepath: alite/src/app/(app)/budgets/[id]/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function BudgetDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Budget detail error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this budget"
      message="Your budget settings are safe. Try again in a moment."
      onRetry={reset}
      secondaryHref="/budgets"
      secondaryLabel="All budgets"
    />
  )
}