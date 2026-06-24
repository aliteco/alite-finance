import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EditAccountForm from '@/components/edit-account-form'

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { id } = await params

  // 1. Fetch account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, name, type, currency, color, include_in_net_worth')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (accountError || !account) notFound()

  // 2. Fetch transactions to compute balance
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('account_id', id)

  const currentBalance =
    transactions?.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount)
    }, 0) ?? 0

  return (
    <div className="min-h-screen bg-background pb-28 md:pl-56">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={`/accounts/${account.id}`}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
            aria-label="Back"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">
            Edit account
          </h1>
        </div>

        {/* Form */}
        <EditAccountForm
          accountId={account.id}
          initialName={account.name}
          initialType={account.type}
          initialColor={account.color ?? '#6366f1'}
          initialIncludeInNetWorth={account.include_in_net_worth ?? true}
          currency={account.currency}
          currentBalance={currentBalance}
        />
      </div>
    </div>
  )
}