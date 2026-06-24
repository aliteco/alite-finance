// filepath: alite/src/app/(app)/settings/categories/error.tsx
'use client'

import { useEffect } from 'react'
import ErrorState from '@/components/error-state'

export default function CategoriesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Categories error:', error)
  }, [error])

  return (
    <ErrorState
      title="Couldn't load categories"
      message="Your existing categories are safe. Try again in a moment."
      onRetry={reset}
      secondaryHref="/settings"
      secondaryLabel="Settings"
    />
  )
}