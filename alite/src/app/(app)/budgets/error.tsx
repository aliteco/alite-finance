// filepath: alite/src/app/(app)/budgets/error.tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function BudgetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Budgets module error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-expense/10 flex items-center justify-center mx-auto" aria-hidden="true">
          <span className="text-2xl">⚠</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t load your budgets</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          This is usually a temporary connection issue, or the budget progress function
          isn&apos;t available yet. Your data is safe.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="h-10 px-5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center focus-visible:ring-2"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}