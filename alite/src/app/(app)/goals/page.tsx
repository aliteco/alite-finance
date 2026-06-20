import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Goal {
  id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  currency: string
  target_date: string | null
  icon: string
  color: string
  is_completed: boolean
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function pct(current: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function daysUntil(dateStr: string | null): string | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Past due'
  if (days === 0) return 'Due today'
  if (days < 30) return `${days}d left`
  if (days < 365) return `${Math.round(days / 30)}mo left`
  return `${(days / 365).toFixed(1)}y left`
}

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goalsData } = await supabase
    .from('goals')
    .select('id, name, description, target_amount, current_amount, currency, target_date, icon, color, is_completed')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('is_completed', { ascending: true })
    .order('target_date', { ascending: true, nullsFirst: false })

  const goals: Goal[] = goalsData ?? []
  const active = goals.filter(g => !g.is_completed)
  const completed = goals.filter(g => g.is_completed)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Goals
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {active.length} active
            </h1>
          </div>
          <Link
            href="/goals/new"
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-light hover:opacity-90 transition-opacity shrink-0"
            aria-label="Create goal"
          >
            +
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-2xl px-6 py-14 text-center border border-border bg-card">
            <div className="text-4xl mb-4" aria-hidden="true">🎯</div>
            <p className="text-sm font-semibold text-foreground mb-1">No goals yet</p>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
              Set a savings target — an emergency fund, a trip, a new laptop — and track your progress.
            </p>
            <Link
              href="/goals/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              + Create goal
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(goal => <GoalCard key={goal.id} goal={goal} />)}

            {completed.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
                  Completed
                </p>
                <div className="space-y-3">
                  {completed.map(goal => <GoalCard key={goal.id} goal={goal} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function GoalCard({ goal }: { goal: Goal }) {
  const percentage = pct(goal.current_amount, goal.target_amount)
  const remaining = daysUntil(goal.target_date)

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-border bg-card px-4 py-4 hover:border-border-strong transition-colors"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${goal.color}22`, color: goal.color }}
          aria-hidden="true"
        >
          {goal.is_completed ? '✓' : (goal.icon || '🎯')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{goal.name}</p>
          {goal.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{goal.description}</p>
          )}
        </div>
        {remaining && !goal.is_completed && (
          <span className="text-[10px] font-medium text-muted-foreground shrink-0 bg-muted rounded-full px-2 py-1">
            {remaining}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {formatCurrency(goal.current_amount, goal.currency)}
          <span className="font-normal text-muted-foreground">
            {' '}/ {formatCurrency(goal.target_amount, goal.currency)}
          </span>
        </p>
        <p className="text-xs font-semibold tabular-nums text-muted-foreground">{percentage}%</p>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, background: goal.is_completed ? 'var(--income)' : goal.color }}
        />
      </div>
    </Link>
  )
}