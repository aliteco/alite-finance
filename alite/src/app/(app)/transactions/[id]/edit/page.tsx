// filepath: alite/src/app/(app)/transactions/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/app/actions/transactions'
import EditTransactionForm from '@/components/edit-transaction-form'

interface TxForEdit {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  account_id: string
  category_id: string | null
  description: string | null
  date: string
  transfer_id: string | null
}

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [txRes, accountsRes, categories] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, type, amount, account_id, category_id, description, date, transfer_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single<TxForEdit>(),

    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('user_id', user.id)
      .order('name'),

    getCategories(),
  ])

  if (txRes.error || !txRes.data) notFound()

  const tx = txRes.data

  if (tx.type === 'transfer' || tx.transfer_id) {
    redirect(`/transactions/${id}`)
  }

  if (!tx.category_id) {
    // Defensive fallback: legacy rows could theoretically lack a category.
    // Edit form requires a category id to preselect; default to empty string
    // so the user is prompted to choose one rather than crashing.
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/transactions/${id}`}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
            aria-label="Back to transaction"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Edit transaction</h1>
        </div>

        <EditTransactionForm
          transaction={{
            id: tx.id,
            type: tx.type as 'income' | 'expense',
            amount: tx.amount,
            account_id: tx.account_id,
            category_id: tx.category_id ?? '',
            description: tx.description ?? '',
            date: tx.date,
          }}
          accounts={accountsRes.data ?? []}
          categories={categories}
        />
      </div>
    </div>
  )
}