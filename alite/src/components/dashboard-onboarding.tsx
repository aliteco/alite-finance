'use client'

import Link from 'next/link'

export default function DashboardOnboarding({ hasAccounts }: { hasAccounts: boolean }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      <div
        className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto text-3xl"
        aria-hidden="true"
      >
        {hasAccounts ? '📝' : '🏦'}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {hasAccounts ? 'Add your first transaction' : 'Welcome to Alite'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {hasAccounts
            ? 'Your accounts are set up. Record an income or expense to see your dashboard come alive with real numbers.'
            : 'Create your first account — cash, bank, savings, or credit card — to start tracking your net worth and spending.'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {hasAccounts ? (
          <>
            <Link
              href="/transactions/new"
              className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              + Add transaction
            </Link>
            <Link
              href="/accounts/new"
              className="h-11 px-6 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center focus-visible:ring-2"
            >
              Add another account
            </Link>
          </>
        ) : (
          <Link
            href="/accounts/new"
            className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            + Create your first account
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-8 max-w-xl mx-auto">
        {[
          { icon: '↕', title: 'Track everything', body: 'Income, expenses, and transfers across every currency you use.' },
          { icon: '◎', title: 'Set budgets', body: 'Per-category limits that update automatically as you spend.' },
          { icon: '🎯', title: 'Hit your goals', body: 'Save toward a target with progress you can actually see.' },
        ].map(f => (
          <div key={f.title} className="bg-card border border-border rounded-2xl p-4 text-left">
            <div className="w-8 h-8 rounded-[9px] bg-muted flex items-center justify-center text-base mb-3" aria-hidden="true">
              {f.icon}
            </div>
            <h3 className="text-xs font-semibold text-foreground mb-1">{f.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}