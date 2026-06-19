import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Budget {
  id: string
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  is_active: boolean
  category_id: string | null
  categories: { name: string; color: string; icon: string } | null
}

interface Profile {
  base_currency: string
}

interface SpendingRow {
  category_id: string | null
  total: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getPeriodLabel(period: string) {
  return period === 'weekly' ? 'Weekly' : period === 'yearly' ? 'Yearly' : 'Monthly'
}

function getPeriodDates(period: 'weekly' | 'monthly' | 'yearly') {
  const now = new Date()
  if (period === 'weekly') {
    const day = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }
  if (period === 'yearly') {
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31)
    return { start, end }
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start, end }
}

function pct(spent: number, budget: number) {
  if (budget <= 0) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BudgetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, budgetsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single<Profile>(),

    supabase
      .from('budgets')
      .select(`
        id, name, amount, currency, period,
        start_date, end_date, is_active, category_id,
        categories ( name, color, icon )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('period')
      .order('name'),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const budgets = (budgetsRes.data as unknown as Budget[]) ?? []

  // For each budget, fetch actual spending within the current period
  // We batch this into a single query grouped by category
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const weekStart = (() => {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10)
  })()
  const weekEnd = (() => {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay() + 6); return d.toISOString().slice(0, 10)
  })()
  const yearStart = `${now.getFullYear()}-01-01`
  const yearEnd = `${now.getFullYear()}-12-31`

  // Fetch spending per category for each time window in parallel
  const [monthlySpend, weeklySpend, yearlySpend] = await Promise.all([
    supabase
      .from('transactions')
      .select('category_id, base_currency_amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', monthStart)
      .lte('date', monthEnd),

    supabase
      .from('transactions')
      .select('category_id, base_currency_amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', weekStart)
      .lte('date', weekEnd),

    supabase
      .from('transactions')
      .select('category_id, base_currency_amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', yearStart)
      .lte('date', yearEnd),
  ])

  function sumByCat(rows: { category_id: string | null; base_currency_amount: number }[] | null) {
    const map = new Map<string | null, number>()
    for (const r of rows ?? []) {
      const key = r.category_id
      map.set(key, (map.get(key) ?? 0) + (r.base_currency_amount ?? 0))
    }
    return map
  }

  const monthMap = sumByCat(monthlySpend.data)
  const weekMap = sumByCat(weeklySpend.data)
  const yearMap = sumByCat(yearlySpend.data)

  function getSpent(budget: Budget): number {
    const map =
      budget.period === 'weekly'
        ? weekMap
        : budget.period === 'yearly'
        ? yearMap
        : monthMap
    return map.get(budget.category_id) ?? 0
  }

  // Separate budgets by period
  const monthly = budgets.filter(b => b.period === 'monthly')
  const weekly = budgets.filter(b => b.period === 'weekly')
  const yearly = budgets.filter(b => b.period === 'yearly')

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + getSpent(b), 0)
  const overBudgetCount = budgets.filter(b => getSpent(b) > b.amount).length

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-end justify-between">
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
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-light hover:opacity-90 transition-opacity shrink-0"
            aria-label="Create budget"
          >
            +
          </Link>
        </div>

        {/* ── Overview card ── */}
        {budgets.length > 0 && (
          <div
            className="relative rounded-2xl px-5 py-5 border border-border bg-card overflow-hidden"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  overBudgetCount > 0
                    ? 'radial-gradient(ellipse 60% 50% at 80% -10%, rgba(248,113,113,0.06) 0%, transparent 70%)'
                    : 'radial-gradient(ellipse 60% 50% at 80% -10%, rgba(52,211,153,0.06) 0%, transparent 70%)',
              }}
            />

            <div className="grid grid-cols-3 gap-4">
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
                  {overBudgetCount > 0 ? `${overBudgetCount} budget${overBudgetCount > 1 ? 's' : ''}` : 'None ✓'}
                </p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mt-4">
              <div
                className="h-1.5 rounded-full overflow-hidden bg-muted"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct(totalSpent, totalBudgeted)}%`,
                    background: totalSpent > totalBudgeted ? 'var(--expense)' : 'var(--income)',
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
                {pct(totalSpent, totalBudgeted)}% of total budget used
              </p>
            </div>
          </div>
        )}

        {/* ── Budget sections ── */}
        {budgets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {monthly.length > 0 && (
              <BudgetGroup
                title="Monthly"
                budgets={monthly}
                baseCurrency={baseCurrency}
                getSpent={getSpent}
              />
            )}
            {weekly.length > 0 && (
              <BudgetGroup
                title="Weekly"
                budgets={weekly}
                baseCurrency={baseCurrency}
                getSpent={getSpent}
              />
            )}
            {yearly.length > 0 && (
              <BudgetGroup
                title="Yearly"
                budgets={yearly}
                baseCurrency={baseCurrency}
                getSpent={getSpent}
              />
            )}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Budget Group ──────────────────────────────────────────────────────────────

function BudgetGroup({
  title,
  budgets,
  baseCurrency,
  getSpent,
}: {
  title: string
  budgets: Budget[]
  baseCurrency: string
  getSpent: (b: Budget) => number
}) {
  return (
    <section>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
        {title}
      </p>
      <div
        className="rounded-2xl overflow-hidden border border-border bg-card"
      >
        {budgets.map((budget, i) => (
          <BudgetRow
            key={budget.id}
            budget={budget}
            spent={getSpent(budget)}
            baseCurrency={baseCurrency}
            hasBorder={i < budgets.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Budget Row ────────────────────────────────────────────────────────────────

function BudgetRow({
  budget,
  spent,
  baseCurrency,
  hasBorder,
}: {
  budget: Budget
  spent: number
  baseCurrency: string
  hasBorder: boolean
}) {
  const remaining = budget.amount - spent
  const percentage = pct(spent, budget.amount)
  const isOver = spent > budget.amount
  const isWarning = percentage >= 80 && !isOver

  const category = budget.categories as unknown as {
    name: string
    color: string
    icon: string
  } | null

  const barColor = isOver
    ? 'var(--expense)'
    : isWarning
    ? '#f59e0b'
    : 'var(--income)'

  return (
    <div
      className={`px-4 py-4 ${hasBorder ? 'border-b border-border' : ''}`}
    >
      {/* Row header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Category dot */}
        <div
          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-sm shrink-0 mt-0.5"
          style={{
            background: category?.color ? `${category.color}22` : 'rgba(255,255,255,0.06)',
            color: category?.color ?? 'var(--muted-foreground)',
          }}
        >
          {category?.icon ?? (budget.name.charAt(0).toUpperCase())}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">
              {budget.name}
            </p>
            <p
              className={`text-xs font-bold tabular-nums shrink-0 ${
                isOver ? 'text-expense' : 'text-foreground'
              }`}
            >
              {formatCurrency(spent, baseCurrency)}
              <span className="font-normal text-muted-foreground">
                {' '}/ {formatCurrency(budget.amount, baseCurrency)}
              </span>
            </p>
          </div>

          <div className="flex items-center justify-between mt-0.5">
            <p className="text-[10px] text-muted-foreground">
              {category?.name ?? 'All categories'} · {getPeriodLabel(budget.period)}
            </p>
            <p
              className={`text-[10px] font-semibold tabular-nums ${
                isOver
                  ? 'text-expense'
                  : isWarning
                  ? 'text-[#f59e0b]'
                  : 'text-muted-foreground'
              }`}
            >
              {isOver
                ? `${formatCurrency(Math.abs(remaining), baseCurrency)} over`
                : `${formatCurrency(remaining, baseCurrency)} left`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full overflow-hidden bg-muted"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: barColor,
          }}
        />
      </div>

      {/* Percentage label */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1">
          {isOver && (
            <span className="text-[10px] font-semibold text-expense">
              ⚠ Over budget
            </span>
          )}
          {isWarning && (
            <span className="text-[10px] font-semibold text-amber-500">
              Almost at limit
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {percentage}%
        </p>
      </div>
    </div>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-2xl px-6 py-14 text-center"
      style={{
        border: '0.5px solid rgba(255,255,255,0.08)',
        background: 'var(--card)',
      }}
    >
      <div className="text-4xl mb-4">🎯</div>
      <p className="text-sm font-semibold text-foreground mb-1">No budgets yet</p>
      <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
        Set spending limits per category to stay on track with your monthly goals.
      </p>
      <Link
        href="/budgets/new"
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        + Create budget
      </Link>
    </div>
  )
}