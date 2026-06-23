// filepath: alite/src/app/(app)/budgets/[id]/not-found.tsx

import Link from 'next/link'

export default function BudgetNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4" aria-hidden="true">🎯</div>
        <h1 className="text-lg font-semibold text-foreground mb-2">Budget not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This budget may have been deleted or you don&apos;t have access to it.
        </p>
        <Link
          href="/budgets"
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2"
        >
          Back to budgets
        </Link>
      </div>
    </div>
  )
}