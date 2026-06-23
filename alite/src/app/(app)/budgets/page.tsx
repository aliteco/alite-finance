// filepath: alite/src/app/(app)/budgets/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBudgetProgress } from '@/app/actions/budgets'
import DeleteBudgetButton from '@/components/delete-budget-button'
import BudgetProgressBar from '@/components/budget-progress-bar'
import BudgetChart from '@/components/budget-chart'
import EmptyState from '@/components/empty-state'

interface Category {
  name: string
  color: string | null
  icon: string | null
}

interface BudgetRow {
  id: string
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  category_id: string | null
  is_active: boolean
  categories: Category | null
}

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

  const [budgetsRes, progressRows] = await Promise.all([
    supabase
      .from('budgets')
      .select(`
        id, name, amount, currency, period, category_id, is_active,
        categories ( name, color, icon )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    getBudgetProgress(),
  ])

  const budgets = ((budgetsRes.data ?? []) as unknown[]).map((row) => {
    const b = row as Omit<BudgetRow, 'categories'> & { categories: Category | Category[] | null }
    return {
      ...b,
      categories: Array.isArray(b.categories) ? b.categories[0] ?? null : b.categories,
    }
  }) as BudgetRow[]

  const withProgress = budgets.map(b => {
    const p = progressRows.find(pr => pr.budget_id === b.id)
    return {
      ...b,
      spent: p?.spent ?? 0,
      remaining: p?.remaining ?? b.amount,
      percentage: p?.percentage ?? 0,
      isOver: p?.is_over ?? false,
    }
  })

  const totalBudgeted = withProgress.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = withProgress.reduce((sum, b) => sum + b.spent, 0)
  const overCount = withProgress.filter(b => b.isOver).length
  const primaryCurrency = budgets[0]?.currency ?? 'IDR'

  const chartData = withProgress.map(b => ({
    name: b.name,
    amount: b.amount,
    spent: b.spent,
    percentage: b.percentage,
    category_color: b.categories?.color ?? null,
  }))

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Budgets
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {budgets.length} active
            </h1>
            {overCount > 0 && (
              <p className="text-xs text-expense font-medium mt-1.5">
                {overCount} over limit
              </p>
            )}
          </div>
          <Link
            href="/budgets/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            <span>+</span>
            <span className="hidden sm:inline">New Budget</span>
          </Link>
        </div>

        {budgets.length === 0 ? (
          <EmptyState
            icon="◎"
            title="No budgets yet"
            description="Set a spending limit on any category — or across all spending — to see live progress as you go."
            actionHref="/budgets/new"
            actionLabel="+ Create a budget"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">

            <div className="md:col-span-5 md:sticky md:top-6 space-y-6">
              <div className="rounded-2xl border border-border bg-card px-6 py-6 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">
                  Total this period
                </p>
                <p className={`text-4xl font-extrabold tracking-tight tabular-nums leading-none ${totalSpent > totalBudgeted ? 'text-expense' : 'text-foreground'}`}>
                  {formatCurrency(totalSpent, primaryCurrency)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  of {formatCurrency(totalBudgeted, primaryCurrency)} budgeted
                </p>
                <div className="mt-4">
                  <BudgetProgressBar
                    percentage={totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0}
                    isOver={totalSpent > totalBudgeted}
                  />
                </div>
              </div>

              {chartData.length > 1 && (
                <BudgetChart data={chartData} baseCurrency={primaryCurrency} />
              )}
            </div>

            <div className="md:col-span-7 space-y-3">
              {withProgress.map(b => (
                <Link
                  key={b.id}
                  href={`/budgets/${b.id}`}
                  className="block rounded-2xl border border-border bg-card px-4 py-4 hover:border-border-strong transition-colors focus-visible:ring-2"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-[9px] flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: b.categories?.color ? `${b.categories.color}22` : 'var(--muted)',
                          color: b.categories?.color ?? 'var(--muted-foreground)',
                        }}
                        aria-hidden="true"
                      >
                        {b.categories?.icon ?? b.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{b.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {b.categories?.name ?? 'All categories'} · {getPeriodLabel(b.period)}
                        </p>
                      </div>
                    </div>
                    <DeleteBudgetButton budgetId={b.id} />
                  </div>

                  <BudgetProgressBar percentage={b.percentage} isOver={b.isOver} color={b.categories?.color} height="sm" />

                  <div className="flex items-center justify-between mt-1.5 text-[11px]">
                    <span className={b.isOver ? 'text-expense font-semibold' : 'text-muted-foreground'}>
                      {formatCurrency(b.spent, b.currency)} of {formatCurrency(b.amount, b.currency)}
                    </span>
                    <span className={`font-semibold ${b.isOver ? 'text-expense' : 'text-income'}`}>
                      {b.isOver
                        ? `${formatCurrency(Math.abs(b.remaining), b.currency)} over`
                        : `${formatCurrency(b.remaining, b.currency)} left`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}