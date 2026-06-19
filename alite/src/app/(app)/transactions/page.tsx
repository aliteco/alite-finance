import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TransactionForm from '@/components/transaction-form'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; type?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const defaultAccountId = params.account
  const defaultType = params.type as 'income' | 'expense' | 'transfer' | undefined

  const [profileRes, accountsRes, categoriesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single(),

    supabase
      .from('accounts')
      .select('id, name, type, currency, color, balance')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('categories')
      .select('id, name, type, color, icon')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('is_system', { ascending: false })
      .order('name'),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const accounts = accountsRes.data ?? []
  const categories = categoriesRes.data ?? []

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Transactions
            </Link>
          </div>

          <div
            className="rounded-2xl px-6 py-14 text-center"
            style={{
              border: '0.5px solid rgba(255,255,255,0.08)',
              background: 'var(--card)',
            }}
          >
            <div className="text-4xl mb-4">🏦</div>
            <p className="text-sm font-semibold text-foreground mb-1">
              No accounts yet
            </p>
            <p className="text-xs text-muted-foreground mb-5">
              You need at least one account before adding transactions.
            </p>
            <Link
              href="/accounts/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              + Add account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </Link>
          </div>
          <h1 className="text-base font-bold tracking-tight text-foreground">
            New Transaction
          </h1>
          <div className="w-12" /> {/* spacer */}
        </div>

        {/* ── Form ── */}
        <TransactionForm
          accounts={accounts}
          categories={categories}
          baseCurrency={baseCurrency}
          defaultAccountId={defaultAccountId}
          defaultType={defaultType}
        />

      </div>
    </div>
  )
}