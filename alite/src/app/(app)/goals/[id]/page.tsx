import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContributeForm from '@/components/contribute-form'
import DeleteGoalButton from '@/components/delete-goal-button'
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'

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

interface Contribution {
  id: string
  amount: number
  currency: string
  base_currency_amount: number
  date: string
  notes: string | null
}

export function formatCurrency(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

function pct(current: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [goalRes, contributionsRes, accountsRes] = await Promise.all([
    supabase
      .from('goals')
      .select('id, name, description, target_amount, current_amount, currency, target_date, icon, color, is_completed')
      .eq('id', id)
      .eq('user_id', user.id)
      .single<Goal>(),

    supabase
      .from('goal_contributions')
      .select('id, amount, currency, base_currency_amount, date, notes')
      .eq('goal_id', id)
      .eq('user_id', user.id)
      .order('date', { ascending: false }),

    supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ])

  if (goalRes.error || !goalRes.data) notFound()

  const goal = goalRes.data
  const contributions: Contribution[] = contributionsRes.data ?? []
  const accounts = accountsRes.data ?? []
  const percentage = pct(goal.current_amount, goal.target_amount)
  const remaining = goal.target_amount - goal.current_amount

  let monthlyNeeded: number | null = null
  if (goal.target_date && !goal.is_completed) {
    const nowMs = new Date().getTime()
    const months = Math.max(
      1,
      (new Date(goal.target_date).getTime() - nowMs) / (1000 * 60 * 60 * 24 * 30)
    )
    monthlyNeeded = remaining / months
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        <div className="flex items-center justify-between">
          <Link
            href="/goals"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Goals
          </Link>
          {!goal.is_completed && (
            <Link
              href={`/goals/${id}/edit`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border focus-visible:ring-2"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-border bg-card px-5 py-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${goal.color}18 0%, transparent 70%)` }}
          />
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
            style={{ background: `${goal.color}22`, color: goal.color }}
            aria-hidden="true"
          >
            {goal.is_completed ? '✓' : (goal.icon || '🎯')}
          </div>
          <h1 className="text-lg font-bold text-foreground">{goal.name}</h1>
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
          )}

          <p className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground mt-4">
            {formatCurrency(goal.current_amount, goal.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            of {formatCurrency(goal.target_amount, goal.currency)} goal
          </p>

          <div
            className="h-2 rounded-full overflow-hidden bg-muted mt-4"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, background: goal.is_completed ? 'var(--income)' : goal.color }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">{percentage}% complete</p>

          {goal.is_completed && (
            <p className="text-xs font-semibold text-income mt-3">🎉 Goal completed!</p>
          )}
        </div>

        {/* Stats */}
        {!goal.is_completed && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Remaining</p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {formatCurrency(remaining, goal.currency)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                {goal.target_date ? 'Per month needed' : 'Target date'}
              </p>
              <p className="text-sm font-bold tabular-nums text-foreground">
                {monthlyNeeded != null
                  ? formatCurrency(monthlyNeeded, goal.currency)
                  : goal.target_date
                    ? new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Not set'}
              </p>
            </div>
          </div>
        )}

        {/* Add contribution */}
        {!goal.is_completed && (
          <ContributeForm goalId={goal.id} accounts={accounts} goalCurrency={goal.currency} />
        )}

        {/* History */}
        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
            Contribution history
          </p>
          {contributions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No contributions yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {contributions.map((c, i) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between px-4 py-3 ${i < contributions.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {new Date(c.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {c.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{c.notes}</p>}
                  </div>
                  <p className="text-xs font-bold tabular-nums text-income">
                    +{formatCurrency(c.amount, c.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <DeleteGoalButton goalId={goal.id} />
      </div>
    </div>
  )
}