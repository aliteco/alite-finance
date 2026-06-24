// filepath: alite/src/app/(app)/recurring/[id]/edit/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function EditRecurringError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Edit recurring error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this rule"
      message="Your recurring rule is unaffected. Try again in a moment."
      onRetry={reset}
      secondaryHref="/recurring"
      secondaryLabel="All recurring"
    />
  )
}