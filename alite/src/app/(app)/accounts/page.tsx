// filepath: alite/src/app/(app)/accounts/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AccountsPage from '@/components/account-page'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  color: string
  is_active: boolean
  include_in_net_worth: boolean
}

interface Profile {
  base_currency: string
}

export default async function AccountsPageServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, accountsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single(),

    supabase
      .from('accounts')
      .select('id, name, type, currency, balance, color, is_active, include_in_net_worth')
      .eq('user_id', user.id)
      .order('type')
      .order('name'),
  ])

  const baseCurrency = (profileRes.data as unknown as Profile)?.base_currency ?? 'IDR'
  const accounts: Account[] = accountsRes.data ?? []

  return (
    <AccountsPage
      initialAccounts={accounts}
      baseCurrency={baseCurrency}
    />
  )
}