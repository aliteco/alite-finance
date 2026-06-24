// filepath: alite/src/app/(app)/goals/[id]/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function GoalDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Goal detail error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this goal"
      message="Your saved progress is safe. Try again in a moment."
      onRetry={reset}
      secondaryHref="/goals"
      secondaryLabel="All goals"
    />
  )
}