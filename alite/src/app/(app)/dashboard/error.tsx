// filepath: alite/src/app/(app)/dashboard/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard module error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load your dashboard"
      message="Your data is safe. This is usually a temporary connection issue — try again."
      onRetry={reset}
      secondaryHref="/transactions"
      secondaryLabel="View transactions"
    />
  )
}