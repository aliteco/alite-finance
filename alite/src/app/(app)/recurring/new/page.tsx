// filepath: alite/src/app/(app)/recurring/new/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/app/actions/transactions'
import RecurringForm from '@/components/recurring-form'

export default async function NewRecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [accountsRes, categories] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
    getCategories(),
  ])

  const accounts = accountsRes.data ?? []

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/recurring" className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg" aria-label="Back">
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">New recurring</h1>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              You need at least one account before adding a recurring rule.
            </p>
            <Link href="/accounts/new" className="text-xs text-primary font-medium">
              Create an account →
            </Link>
          </div>
        ) : (
          <RecurringForm accounts={accounts} categories={categories} />
        )}
      </div>
    </div>
  )
}