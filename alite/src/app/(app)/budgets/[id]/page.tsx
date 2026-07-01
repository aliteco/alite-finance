// filepath: alite/src/app/(app)/budgets/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteBudgetButton from '@/components/delete-budget-button'
import BudgetProgressBar from '@/components/budget-progress-bar'
import BudgetChart from '@/components/budget-chart'
import { getBudgetProgress } from '@/app/actions/budgets'
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'
import { renderCategoryIcon } from '@/lib/icons'

export function formatCurrency(amount: number, currency: string) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

function getPeriodLabel(period: string) {
  return period === 'weekly' ? 'Weekly' : period === 'yearly' ? 'Yearly' : 'Monthly'
}

interface Category {
  name: string
  color: string | null
  icon: string | null
}

interface TxCategory extends Category {}

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [budgetRes, progressRows] = await Promise.all([
    supabase
      .from('budgets')
      .select(`
        id, name, amount, currency, period, start_date, end_date, is_active,
        category_id, categories ( name, color, icon )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),

    getBudgetProgress(),
  ])

  if (budgetRes.error || !budgetRes.data) notFound()

  const rawCategories = budgetRes.data.categories as unknown
  const budget = {
    ...budgetRes.data,
    categories: (Array.isArray(rawCategories) ? rawCategories[0] ?? null : rawCategories) as Category | null,
  }

  const progress = (progressRows ?? []).find(p => p.budget_id === id)

  const spent = progress?.spent ?? 0
  const remaining = progress?.remaining ?? budget.amount
  const percentage = progress?.percentage ?? 0
  const isOver = progress?.is_over ?? false

  const { data: txRows } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      base_currency_amount,
      currency,
      description,
      date,
      categories ( name, icon, color )
    `)
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .is('transfer_id', null)
    .gte('date', progress?.period_start ?? budget.start_date)
    .lte('date', progress?.period_end ?? new Date().toISOString().slice(0, 10))
    .order('date', { ascending: false })
    .limit(10)

  const filteredTx = ((txRows ?? []) as unknown[]).map((row) => {
    const tx = row as {
      id: string
      amount: number
      base_currency_amount: number
      currency: string
      description: string | null
      date: string
      categories: TxCategory | TxCategory[] | null
    }
    return {
      ...tx,
      categories: Array.isArray(tx.categories) ? tx.categories[0] ?? null : tx.categories,
    }
  }) as Array<{
    id: string
    amount: number
    base_currency_amount: number
    currency: string
    description: string | null
    date: string
    categories: TxCategory | null
  }>

  // Chart data needs all budgets to be meaningful as a comparison; pull
  // sibling active budgets (lightweight) so the chart isn't single-bar.
  const { data: siblingBudgets } = await supabase
    .from('budgets')
    .select('id, name, amount, currency, category_id, categories ( color )')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const chartData = (siblingBudgets ?? []).map((b) => {
    const match = (progressRows ?? []).find(p => p.budget_id === b.id)
    const cat = Array.isArray(b.categories) ? b.categories[0] : b.categories
    return {
      name: b.name,
      amount: b.amount,
      spent: match?.spent ?? 0,
      percentage: match?.percentage ?? 0,
      category_color: (cat as { color?: string } | null)?.color ?? null,
    }
  })

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">
        <div className="flex items-center justify-between">
          <Link
            href="/budgets"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Budgets
          </Link>

          <Link
            href={`/budgets/${id}/edit`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border focus-visible:ring-2"
          >
            Edit
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-6 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-bold"
            style={{
              background: budget.categories?.color ? `${budget.categories.color}22` : 'var(--muted)',
              color: budget.categories?.color ?? 'var(--muted-foreground)',
            }}
            aria-hidden="true"
          >
            {renderCategoryIcon(budget.categories?.icon, budget.name.charAt(0).toUpperCase())}
          </div>

          <h1 className="text-sm font-semibold text-foreground">{budget.name}</h1>

          <p className="text-[11px] text-muted-foreground mt-0.5">
            {budget.categories?.name ?? 'All categories'} · {getPeriodLabel(budget.period)}
          </p>

          <p className={`text-4xl font-extrabold mt-4 ${isOver ? 'text-expense' : 'text-foreground'}`}>
            {formatCurrency(spent, budget.currency)}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            of {formatCurrency(budget.amount, budget.currency)} limit
          </p>

          <div className="mt-4">
            <BudgetProgressBar percentage={percentage} isOver={isOver} color={budget.categories?.color} />
          </div>

          <p className={`text-[11px] font-semibold mt-2 ${isOver ? 'text-expense' : 'text-muted-foreground'}`}>
            {isOver
              ? `${formatCurrency(Math.abs(remaining), budget.currency)} over budget`
              : `${formatCurrency(remaining, budget.currency)} remaining`}
          </p>
        </div>

        {chartData.length > 1 && (
          <BudgetChart data={chartData} baseCurrency={budget.currency} />
        )}

        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
            Contributing transactions
          </p>

          {filteredTx.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No expenses logged in this period yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {filteredTx.map((tx, i) => (
                <Link
                  href={`/transactions/${tx.id}`}
                  key={tx.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors focus-visible:ring-2 ${
                    i < filteredTx.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {tx.description ?? tx.categories?.name ?? 'Expense'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <p className="text-xs font-bold text-expense shrink-0">
                    −{formatCurrency(tx.amount, tx.currency)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <DeleteBudgetButton budgetId={budget.id} />
      </div>
    </div>
  )
}