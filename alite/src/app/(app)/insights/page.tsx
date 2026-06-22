// filepath: alite/src/app/(app)/insights/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getCashflowReport,
  getSpendingBreakdown,
  getSavingsRateReport,
  getBurnRateReport,
} from '@/app/actions/analytics'
import InsightsView from '@/components/insights-view'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('base_currency')
    .eq('id', user.id)
    .single()

  const [cashflow, spending, savings, burn] = await Promise.all([
    getCashflowReport(6),
    getSpendingBreakdown(1),
    getSavingsRateReport(1),
    getBurnRateReport(3),
  ])

  return (
    <InsightsView
      baseCurrency={profile?.base_currency ?? 'IDR'}
      cashflow={cashflow}
      spending={spending}
      savings={savings}
      burn={burn}
    />
  )
}