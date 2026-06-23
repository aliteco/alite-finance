// filepath: alite/src/components/error-state.tsx

'use client'

import Link from 'next/link'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'This is usually temporary. Your data is safe — try again in a moment.',
  onRetry,
  retryLabel = 'Try again',
  secondaryHref,
  secondaryLabel = 'Dashboard',
}: ErrorStateProps) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div
          className="w-12 h-12 rounded-2xl bg-expense/10 flex items-center justify-center mx-auto mb-4"
          aria-hidden="true"
        >
          <span className="text-2xl">⚠</span>
        </div>
        <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {retryLabel}
            </button>
          )}
            {secondaryHref && (
            <Link
                href={secondaryHref}
                className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center focus-visible:ring-2"
            >
                {secondaryLabel}
            </Link>
        )}
        </div>
      </div>
    </div>
  )
}