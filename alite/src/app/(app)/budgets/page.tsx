// filepath: alite/src/app/(app)/budgets/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBudgetProgress, type BudgetProgress } from '@/app/actions/budgets'
import DeleteBudgetButton from '@/components/delete-budget-button'
import BudgetChart from '@/components/budget-chart'

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`
  }
}

function getPeriodLabel(period: string) {
  return period === 'weekly' ? 'Weekly' : period === 'yearly' ? 'Yearly' : 'Monthly'
}

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, budgets] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),
    getBudgetProgress(),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'

  const monthly = budgets.filter(b => b.period === 'monthly')
  const weekly = budgets.filter(b => b.period === 'weekly')
  const yearly = budgets.filter(b => b.period === 'yearly')

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overBudgetCount = budgets.filter(b => b.is_over).length
  const totalPct = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Budgets
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {budgets.length} limit{budgets.length !== 1 ? 's' : ''}
            </h1>
          </div>
          <Link
            href="/budgets/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Create budget"
          >
            <span>+</span>
            <span className="hidden sm:inline">New Limit</span>
          </Link>
        </div>

        {budgets.length === 0 ? (
          <EmptyState />
        ) : (
          /* Responsive split layout grid */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
            
            {/* Left Col: Aggregated Statistics Panel */}
            <div className="md:col-span-5 md:sticky md:top-6 space-y-6">
              <div className="relative rounded-2xl px-6 py-6 border border-border bg-card overflow-hidden shadow-sm">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      overBudgetCount > 0
                        ? 'radial-gradient(ellipse 65% 55% at 80% -10%, rgba(248,113,113,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(ellipse 65% 55% at 80% -10%, rgba(52,211,153,0.08) 0%, transparent 70%)',
                  }}
                />
                
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Combined Spending Health</h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Budgeted</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {formatCurrency(totalBudgeted, baseCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Spent</p>
                    <p className={`text-sm font-bold tabular-nums ${totalSpent > totalBudgeted ? 'text-expense' : 'text-foreground'}`}>
                      {formatCurrency(totalSpent, baseCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Over limit</p>
                    <p className={`text-sm font-bold ${overBudgetCount > 0 ? 'text-expense' : 'text-income'}`}>
                      {overBudgetCount > 0 ? `${overBudgetCount} active` : 'None ✓'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Overall Usage</span>
                    <span className="text-xs font-bold text-foreground tabular-nums">{totalPct}%</span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden bg-muted"
                    role="progressbar"
                    aria-valuenow={totalPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Total budget used"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalPct}%`,
                        background: totalSpent > totalBudgeted ? 'var(--expense)' : 'var(--income)',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground/85 mt-2 leading-relaxed">
                    Across all limits, you have consumed {formatCurrency(totalSpent, baseCurrency)} of your aggregate allowance.
                  </p>
                </div>
              </div>

              {/* Dynamic Budget Utilization Chart */}
              <BudgetChart data={budgets} baseCurrency={baseCurrency} />

              <div className="hidden md:block rounded-2xl bg-muted/20 border border-border/25 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Daily Allowance Guidance</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The recommended maximum spending per day adjusts automatically based on the cycle period, remaining funds, and the current date. Stay green by staying under suggested amounts.
                </p>
              </div>
            </div>

            {/* Right Col: Interactive Budget Groups and Lists */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-6">
                {monthly.length > 0 && <BudgetGroup title="Monthly Limits" budgets={monthly} baseCurrency={baseCurrency} />}
                {weekly.length > 0 && <BudgetGroup title="Weekly Limits" budgets={weekly} baseCurrency={baseCurrency} />}
                {yearly.length > 0 && <BudgetGroup title="Yearly Limits" budgets={yearly} baseCurrency={baseCurrency} />}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

function BudgetGroup({
  title,
  budgets,
  baseCurrency,
}: {
  title: string
  budgets: BudgetProgress[]
  baseCurrency: string
}) {
  return (
    <section aria-labelledby={`budget-group-${title}`}>
      <p id={`budget-group-${title}`} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
        {title}
      </p>
      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        {budgets.map((budget, i) => (
          <BudgetRow key={budget.budget_id} budget={budget} baseCurrency={baseCurrency} hasBorder={i < budgets.length - 1} />
        ))}
      </div>
    </section>
  )
}

function getDailyAllowance(remaining: number, period: string) {
  if (remaining <= 0) return null
  const now = new Date()
  if (period === 'monthly') {
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const daysLeft = Math.max(1, endOfMonth.getDate() - now.getDate() + 1)
    return remaining / daysLeft
  } else if (period === 'weekly') {
    const dayOfWeek = now.getDay() // 0 (Sun) to 6 (Sat)
    const daysLeft = Math.max(1, 7 - dayOfWeek)
    return remaining / daysLeft
  } else if (period === 'yearly') {
    const endOfYear = new Date(now.getFullYear(), 11, 31)
    const diffTime = endOfYear.getTime() - now.getTime()
    const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    return remaining / daysLeft
  }
  return null
}

function BudgetRow({
  budget,
  baseCurrency,
  hasBorder,
}: {
  budget: BudgetProgress
  baseCurrency: string
  hasBorder: boolean
}) {
  const isWarning = budget.percentage >= 80 && !budget.is_over
  const barColor = budget.is_over ? 'var(--expense)' : isWarning ? '#f59e0b' : 'var(--income)'
  const displayPct = Math.min(100, budget.percentage)
  const dailyAllowance = getDailyAllowance(budget.remaining, budget.period)

  return (
    <div className={`px-4 py-4 hover:bg-muted/10 transition-colors ${hasBorder ? 'border-b border-border' : ''}`}>
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-sm shrink-0 mt-0.5"
          style={{
            background: budget.category_color ? `${budget.category_color}22` : 'var(--muted)',
            color: budget.category_color ?? 'var(--muted-foreground)',
          }}
          aria-hidden="true"
        >
          {budget.category_icon ?? budget.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{budget.name}</p>
            <div className="flex items-center gap-2 shrink-0">
              <p className={`text-xs font-bold tabular-nums ${budget.is_over ? 'text-expense' : 'text-foreground'}`}>
                {formatCurrency(budget.spent, baseCurrency)}
                <span className="font-normal text-muted-foreground"> / {formatCurrency(budget.amount, baseCurrency)}</span>
              </p>
              <DeleteBudgetButton budgetId={budget.budget_id} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[10px] text-muted-foreground">
              {budget.category_name ?? 'All categories'} · {getPeriodLabel(budget.period)}
            </p>
            <p className={`text-[10px] font-semibold tabular-nums ${budget.is_over ? 'text-expense' : isWarning ? 'text-[#f59e0b]' : 'text-muted-foreground'}`}>
              {budget.is_over
                ? `${formatCurrency(Math.abs(budget.remaining), baseCurrency)} over`
                : `${formatCurrency(budget.remaining, baseCurrency)} left`}
            </p>
          </div>
        </div>
      </div>

      <div
        className="h-1.5 rounded-full overflow-hidden bg-muted"
        role="progressbar"
        aria-valuenow={displayPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${budget.name} budget used`}
      >
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${displayPct}%`, background: barColor }} />
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2">
          {budget.is_over ? (
            <span className="text-[10px] font-semibold text-expense flex items-center gap-1">
              <span>⚠</span> Over budget
            </span>
          ) : isWarning ? (
            <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1">
              <span>⚠</span> Almost at limit
            </span>
          ) : dailyAllowance !== null && dailyAllowance > 0 ? (
            <span className="text-[10px] text-muted-foreground">
              Suggested: <strong className="text-foreground tracking-tight tabular-nums">{formatCurrency(dailyAllowance, baseCurrency)}</strong> / day
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span>✓</span> On track
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">{Math.round(budget.percentage)}%</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl px-6 py-14 text-center" style={{ border: '0.5px solid var(--border)', background: 'var(--card)' }}>
      <div className="text-4xl mb-4" aria-hidden="true">🎯</div>
      <p className="text-sm font-semibold text-foreground mb-1">No budgets yet</p>
      <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
        Set spending limits per category to stay on track with your monthly goals.
      </p>
      <Link
        href="/budgets/new"
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        + Create budget
      </Link>
    </div>
  )
}