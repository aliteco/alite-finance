// filepath: alite/src/app/(app)/goals/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EditGoalForm from '@/components/edit-goal-form'

export default async function EditGoalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goal, error } = await supabase
    .from('goals')
    .select('id, name, description, target_amount, target_date, icon, color, currency')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !goal) notFound()

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/goals/${id}`}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
            aria-label="Back to goal"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Edit goal</h1>
        </div>

        <EditGoalForm
          goalId={goal.id}
          initialName={goal.name}
          initialDescription={goal.description ?? ''}
          initialTargetAmount={goal.target_amount}
          initialTargetDate={goal.target_date ?? ''}
          initialIcon={goal.icon}
          initialColor={goal.color}
          currency={goal.currency}
        />
      </div>
    </div>
  )
}