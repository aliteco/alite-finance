// filepath: alite/src/app/(app)/accounts/new/page.tsx

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AccountForm from '@/components/account-form'

export default async function NewAccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('base_currency')
    .eq('id', user.id)
    .single()

  const baseCurrency = profile?.base_currency ?? 'IDR'

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-center justify-between">
          <Link
            href="/accounts"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 focus-visible:ring-2 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Accounts
          </Link>

          <h1 className="text-base font-bold tracking-tight text-foreground">New Account</h1>

          <div className="w-14" aria-hidden="true" />
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Account Details
            </p>
          </div>
          <div className="p-5">
            <AccountForm initialCurrency={baseCurrency} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-medium text-foreground mb-1">Tip</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Create separate accounts for cash, bank, savings, or credit cards.
            This helps your net worth stay accurate automatically. Credit cards
            may carry a negative starting balance to represent existing debt.
          </p>
        </div>

      </div>
    </div>
  )
}