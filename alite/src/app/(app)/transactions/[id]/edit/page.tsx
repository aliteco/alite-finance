// filepath: alite/src/app/(app)/transactions/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/app/actions/transactions'
import EditTransactionForm from '@/components/edit-transaction-form'

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
      .select('id, type, amount, currency, category_id, description, date, account_id, transfer_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
    getCategories(),
  ])

  if (txRes.error || !txRes.data) notFound()
  if (txRes.data.transfer_id || txRes.data.type === 'transfer') {
    redirect(`/transactions/${id}`)
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href={`/transactions/${id}`} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Edit transaction</h1>
        </div>

        <EditTransactionForm
          transaction={{
            id: txRes.data.id,
            type: txRes.data.type as 'income' | 'expense',
            amount: txRes.data.amount,
            account_id: txRes.data.account_id,
            category_id: txRes.data.category_id ?? '',
            description: txRes.data.description ?? '',
            date: txRes.data.date,
          }}
          accounts={accountsRes.data ?? []}
          categories={categories}
        />
      </div>
    </div>
  )
}