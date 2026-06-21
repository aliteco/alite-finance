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

  // Aggregated targets (grouped by currency)
  const totalsByCurrency: Record<string, { target: number; current: number }> = {}
  goals.forEach(g => {
    if (!totalsByCurrency[g.currency]) {
      totalsByCurrency[g.currency] = { target: 0, current: 0 }
    }
    totalsByCurrency[g.currency].target += g.target_amount
    totalsByCurrency[g.currency].current += g.current_amount
  })

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Goals
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {active.length} active goal{active.length !== 1 ? 's' : ''}
            </h1>
          </div>
          <Link
            href="/goals/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Create goal"
          >
            <span>+</span>
            <span className="hidden sm:inline">New Goal</span>
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
          /* Desktop Split Layout Grid */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
            
            {/* Left Col: Target Achievement Bento */}
            <div className="md:col-span-5 md:sticky md:top-6 space-y-6">
              
              <div className="relative rounded-2xl px-6 py-6 border border-border bg-card overflow-hidden shadow-sm">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse 65% 55% at 80% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)',
                  }}
                />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-4">Milestone Tracker</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/10 p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Success Rate</p>
                    <p className="text-2xl font-bold tabular-nums text-foreground mt-0.5">
                      {goals.length > 0 ? Math.round((completed.length / goals.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-muted/10 p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Achieved</p>
                    <p className="text-2xl font-bold text-income mt-0.5">
                      {completed.length} goal{completed.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Savings progress</p>
                  {Object.entries(totalsByCurrency).map(([curr, val]) => {
                    const ratio = pct(val.current, val.target)
                    return (
                      <div key={curr} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground tabular-nums">{curr}</span>
                          <span className="text-muted-foreground tabular-nums">{formatCurrency(val.current, curr)} / {formatCurrency(val.target, curr)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                          <div 
                            className="h-full rounded-full bg-indigo-500 transition-all duration-500" 
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="hidden md:block rounded-2xl bg-muted/20 border border-border/30 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Contribution Suggestion Mode</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Required savings metrics are computed dynamically using your target dates. Keep deposits on track via direct account allocation transfers.
                </p>
              </div>

            </div>

            {/* Right Col: Spacious Goals list and Grid */}
            <div className="md:col-span-7 space-y-6">
              
              {active.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] px-0.5">
                    Active Milestones
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {active.map(goal => <GoalCard key={goal.id} goal={goal} />)}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div className="pt-2 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] px-0.5">
                    Completed Milestones
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {completed.map(goal => <GoalCard key={goal.id} goal={goal} />)}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

function getSuggestedSaving(current: number, target: number, targetDateStr: string | null) {
  if (!targetDateStr || current >= target) return null
  const targetDate = new Date(targetDateStr)
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()
  const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  
  const remainingAmount = target - current
  
  const monthsLeft = daysLeft / 30.43
  if (monthsLeft >= 1) {
    return {
      value: remainingAmount / monthsLeft,
      unit: 'mo',
    }
  } else {
    const weeksLeft = daysLeft / 7
    if (weeksLeft >= 1) {
      return {
        value: remainingAmount / weeksLeft,
        unit: 'wk',
      }
    } else {
      return {
        value: remainingAmount / daysLeft,
        unit: 'day',
      }
    }
  }
}

function GoalCard({ goal }: { goal: Goal }) {
  const percentage = pct(goal.current_amount, goal.target_amount)
  const remaining = daysUntil(goal.target_date)
  const suggestedSaving = getSuggestedSaving(goal.current_amount, goal.target_amount, goal.target_date)

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-border bg-card px-4 py-4 hover:bg-muted/5 transition-colors"
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
          <span className="text-[10px] font-medium text-muted-foreground shrink-0 bg-muted/50 rounded-full px-2 py-1">
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

      {suggestedSaving && !goal.is_completed && (
        <div className="mt-3.5 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span>📈</span>
            <span>Required contribution:</span>
          </span>
          <span className="font-semibold text-foreground bg-muted/45 px-2 py-0.5 rounded-lg border border-border/30">
            {formatCurrency(suggestedSaving.value, goal.currency)} / {suggestedSaving.unit}
          </span>
        </div>
      )}
    </Link>
  )
}