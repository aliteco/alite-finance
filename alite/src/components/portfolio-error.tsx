// filepath: alite/src/components/portfolio-error.tsx
'use client'

import ErrorState from '@/components/error-state'

export default function PortfolioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  if (typeof window !== 'undefined') console.error('Portfolio module error:', error)
  return (
    <ErrorState
      title="Couldn't load your portfolio"
      message="Your accounts are unaffected. Try again in a moment."
      onRetry={reset}
      secondaryHref="/accounts"
      secondaryLabel="View accounts"
    />
  )
}