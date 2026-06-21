import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, base_currency')
    .eq('id', user.id)
    .single()

  return (
    <div className="page-wrapper">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Link
            href="/settings/categories"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors border-b border-border"
          >
            <span className="text-sm font-medium text-foreground">Manage categories</span>
            <span className="text-muted-foreground" aria-hidden="true">→</span>
          </Link>
          <Link
            href="/recurring"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Recurring transactions</span>
            <span className="text-muted-foreground" aria-hidden="true">→</span>
          </Link>
        </div>

        <SettingsForm
          initialName={profile?.full_name ?? ''}
          initialCurrency={profile?.base_currency ?? 'IDR'}
          email={user.email ?? ''}
        />
      </div>
    </div>
  )
}