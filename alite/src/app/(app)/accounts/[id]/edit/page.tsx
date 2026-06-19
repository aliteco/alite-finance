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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const { data: account, error } = await supabase
    .from('accounts')
    .select('id, name, type, currency, include_in_net_worth')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !account) notFound()

  return (
    <div className="min-h-screen bg-background pb-28 md:pl-56">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        <div className="flex items-center gap-3">
          <Link
            href={`/accounts/${account.id}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Edit account</h1>
        </div>

        <EditAccountForm
          accountId={account.id}
          initialName={account.name}
          initialType={account.type}
          initialIncludeInNetWorth={account.include_in_net_worth ?? true}
          currency={account.currency}
        />
      </div>
    </div>
  )
}