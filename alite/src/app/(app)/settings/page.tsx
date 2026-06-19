import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings-form'
import { ThemeToggle } from '@/components/theme-toggle'

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
          <ThemeToggle />
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