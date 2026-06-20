import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GoalForm from '@/components/goal-form'

export default async function NewGoalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('base_currency')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/goals"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to goals"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">New goal</h1>
        </div>

        <GoalForm baseCurrency={profile?.base_currency ?? 'IDR'} />
      </div>
    </div>
  )
}