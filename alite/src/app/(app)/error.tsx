// filepath: alite/src/app/(app)/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App segment error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <ErrorState
        title="Something went wrong"
        message="Your data is safe. This is usually a temporary connection issue — try again."
        onRetry={reset}
        secondaryHref="/dashboard"
        secondaryLabel="Dashboard"
      />
    </div>
  )
}