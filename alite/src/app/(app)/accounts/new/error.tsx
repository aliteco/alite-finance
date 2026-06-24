// filepath: alite/src/app/(app)/accounts/new/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function NewAccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('New account error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load this form"
      message="No account was created. Try again in a moment."
      onRetry={reset}
      secondaryHref="/accounts"
      secondaryLabel="All accounts"
    />
  )
}