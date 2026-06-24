import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/settings-form'
import { FolderKanban, RefreshCw, ChevronRight } from 'lucide-react'

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
    <div className="min-h-screen bg-background text-foreground antialiased">
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-10 pb-16 space-y-8">

        {/* ── Page Header Area ── */}
        <div className="border-b border-border/60 pb-6">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your accounting metrics, currency variants, and profile details for{' '}
            <span className="font-medium text-foreground">{user.email}</span>.
          </p>
        </div>

        {/* ── Sub-Navigation Shortcut Blocks ── */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase block px-1">
            Data Customization
          </span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/settings/categories"
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 hover:border-border-strong transition-all group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                  <FolderKanban size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-foreground">Manage categories</span>
                  <span className="text-[11px] text-muted-foreground">Edit labels and colors</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/recurring"
              className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/50 hover:border-border-strong transition-all group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                  <RefreshCw size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold text-foreground">Recurring flows</span>
                  <span className="text-[11px] text-muted-foreground">Subscriptions & cycles</span>
                </div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ── Main Settings Configuration Layout ── */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase block px-1">
            System Configurations
          </span>
          <SettingsForm
            initialName={profile?.full_name ?? ''}
            initialDisplayCurrency={profile?.base_currency ?? 'IDR'}
            email={user.email ?? ''}
          />
        </div>

      </div>
    </div>
  )
}