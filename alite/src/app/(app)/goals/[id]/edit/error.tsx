// filepath: alite/src/app/(app)/budgets/[id]/edit/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function EditBudgetError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Edit budget error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this budget"
      message="Your budget is unaffected. Try again in a moment."
      onRetry={reset}
      secondaryHref="/budgets"
      secondaryLabel="All budgets"
    />
  )
}