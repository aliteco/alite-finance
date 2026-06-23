// filepath: alite/src/app/(app)/portfolio/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortfolioView from '@/components/portfolio-view'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, accountsRes] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),
    supabase
      .from('accounts')
      .select('id, name, currency, balance, type, color')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('balance', { ascending: false }),
  ])

  return (
    <PortfolioView
      initialAccounts={accountsRes.data ?? []}
      baseCurrency={profileRes.data?.base_currency ?? 'IDR'}
    />
  )
}