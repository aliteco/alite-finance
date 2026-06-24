// filepath: alite/src/app/(app)/recurring/new/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function NewRecurringError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('New recurring error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this form"
      message="Nothing was saved. Try again in a moment."
      onRetry={reset}
      secondaryHref="/recurring"
      secondaryLabel="All recurring"
    />
  )
}