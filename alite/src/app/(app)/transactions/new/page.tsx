// filepath: alite/src/app/(app)/transactions/new/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/app/actions/transactions'
import TransactionForm from '@/components/transaction-form'

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; type?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const [profileRes, accountsRes, categories] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),

    supabase
      .from('accounts')
      .select('id, name, currency, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),

    getCategories(),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'USD'
  const accounts = accountsRes.data ?? []
  const defaultType = (['income', 'expense', 'transfer'] as const).includes(params.type as any)
    ? (params.type as 'income' | 'expense' | 'transfer')
    : undefined

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back"
            >
              ←
            </Link>
            <h1 className="text-xl font-bold tracking-tight">New transaction</h1>
          </div>
          <div className="bg-card border border-border rounded-2xl px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You need at least one account before adding a transaction.
            </p>
            <Link href="/accounts/new" className="text-xs text-primary font-medium">
              Create an account →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        <div className="flex items-center gap-3">
          <Link
            href="/transactions"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">New transaction</h1>
        </div>

        <TransactionForm
          accounts={accounts}
          categories={categories}
          baseCurrency={baseCurrency}
          defaultAccountId={params.account}
          defaultType={defaultType}
        />
      </div>
    </div>
  )
}