import { redirect } from 'next/navigation'
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
    <div className="min-h-screen bg-background pb-28 md:pl-56">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
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