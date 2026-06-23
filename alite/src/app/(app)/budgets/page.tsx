// filepath: alite/src/app/(app)/recurring/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecurringActions from '@/components/recurring-actions'
import CatchUpOverdueButton from '@/components/catch-up-overdue-button'
import RecurringImpactSummary from '@/components/recurring-impact-summary'
import EmptyState from '@/components/empty-state'
import { renderCategoryIcon } from '@/lib/icons'

interface RecurringRow {
  id: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  description: string
  frequency: string
  next_due_date: string
  end_date: string | null
  is_active: boolean
  auto_generate: boolean
  accounts: { name: string } | null
  categories: { name: string; color: string | null; icon: string | null } | null
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

function isOverdue(nextDue: string) {
  return new Date(nextDue) < new Date(new Date().toDateString())
}

function monthlyEquivalent(amount: number, frequency: string) {
  switch (frequency) {
    case 'daily': return amount * 30.44
    case 'weekly': return amount * 4.345
    case 'biweekly': return amount * 2.17
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'yearly': return amount / 12
    default: return amount
  }
}

function getYearlyProjection(amount: number, frequency: string) {
  switch (frequency) {
    case 'daily': return amount * 365
    case 'weekly': return amount * 52
    case 'biweekly': return amount * 26
    case 'monthly': return amount * 12
    case 'quarterly': return amount * 4
    case 'yearly': return amount
    default: return amount
  }
}

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, recurringRes] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),
    supabase
      .from('recurring_transactions')
      .select(`
        id, type, amount, currency, description, frequency,
        next_due_date, end_date, is_active, auto_generate,
        accounts ( name ),
        categories ( name, color, icon )
      `)
      .eq('user_id', user.id)
      .order('is_active', { ascending: false })
      .order('next_due_date', { ascending: true }),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const rows = (recurringRes.data as unknown as RecurringRow[]) ?? []
  const error = recurringRes.error
  const active = rows.filter(r => r.is_active)
  const paused = rows.filter(r => !r.is_active)
  const overdueRules = active.filter(r => isOverdue(r.next_due_date))
  const overdueCount = overdueRules.length

  // Note: this aggregates raw amounts per-currency without FX conversion to
  // base currency for simplicity in the same-currency common case; mixed
  // currencies will under/overstate slightly until normalized server-side.
  const monthlyOutflow = active
    .filter(r => r.type === 'expense' && r.currency === baseCurrency)
    .reduce((sum, r) => sum + monthlyEquivalent(r.amount, r.frequency), 0)

  const monthlyInflow = active
    .filter(r => r.type === 'income' && r.currency === baseCurrency)
    .reduce((sum, r) => sum + monthlyEquivalent(r.amount, r.frequency), 0)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Recurring
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {active.length} active
            </h1>
            {overdueCount > 0 && (
              <p className="text-xs text-expense font-medium mt-1.5">
                {overdueCount} due or overdue
              </p>
            )}
          </div>
          <Link
            href="/recurring/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Create recurring transaction"
          >
            <span>+</span>
            <span className="hidden sm:inline">New Rule</span>
          </Link>
        </div>

        {overdueCount > 0 && <CatchUpOverdueButton overdueCount={overdueCount} />}

        {active.length > 0 && (monthlyOutflow > 0 || monthlyInflow > 0) && (
          <RecurringImpactSummary
            monthlyIncome={monthlyInflow}
            monthlyExpense={monthlyOutflow}
            currency={baseCurrency}
          />
        )}

        {error && (
          <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
            Couldn&apos;t load recurring transactions: {error.message}
          </p>
        )}

        {rows.length === 0 && !error ? (
          <EmptyState
            icon="🔁"
            title="No recurring transactions"
            description="Set up rent, salary, or subscriptions once and either record them manually each cycle or let the daily server check post them automatically."
            actionHref="/recurring/new"
            actionLabel="+ Add recurring"
          />
        ) : (
          <div className="space-y-5">
            {active.length > 0 && (
              <section aria-labelledby="active-recurring">
                <p id="active-recurring" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
                  Active
                </p>
                <div className="rounded-2xl overflow-hidden border border-border bg-card">
                  {active.map((r, i) => (
                    <RecurringRowItem key={r.id} item={r} hasBorder={i < active.length - 1} />
                  ))}
                </div>
              </section>
            )}

            {paused.length > 0 && (
              <section aria-labelledby="paused-recurring">
                <p id="paused-recurring" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
                  Paused
                </p>
                <div className="rounded-2xl overflow-hidden border border-border bg-card opacity-60">
                  {paused.map((r, i) => (
                    <RecurringRowItem key={r.id} item={r} hasBorder={i < paused.length - 1} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card px-4 py-4">
          <p className="text-xs font-medium text-foreground mb-1">How auto-generate works</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rules with auto-generate enabled are posted automatically once a day by a scheduled
            database job (pg_cron → fn_generate_due_recurring). Rules without it stay manual —
            open a rule and use &quot;Record now&quot;, or use &quot;Catch up&quot; above to post all overdue rules.
          </p>
        </div>

      </div>
    </div>
  )
}

function RecurringRowItem({ item, hasBorder }: { item: RecurringRow; hasBorder: boolean }) {
  const overdue = item.is_active && isOverdue(item.next_due_date)
  const isIncome = item.type === 'income'
  const yearlyProj = getYearlyProjection(item.amount, item.frequency)

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/10 transition-colors ${hasBorder ? 'border-b border-border' : ''}`}>
      <Link href={`/recurring/${item.id}`} className="flex items-center gap-3 flex-1 min-w-0 focus-visible:ring-2 rounded-lg">
        <div
          className="w-9 h-9 rounded-[9px] flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: item.categories?.color ? `${item.categories.color}22` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
            color: item.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
          }}
          aria-hidden="true"
        >
          {renderCategoryIcon(item.categories?.icon, item.description ?? 'U', 'w-4.5 h-4.5')}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {item.description}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {item.accounts?.name ?? '—'} · {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
            {item.auto_generate && ' · Auto'}
          </p>
          {yearlyProj > 0 && (
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
              Proj. yearly: <span className="font-medium text-foreground/90 tabular-nums">{formatCurrency(yearlyProj, item.currency)}</span>
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className={`text-sm font-bold tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
            {isIncome ? '+' : '−'}{formatCurrency(item.amount, item.currency)}
          </p>
          <p className={`text-[10px] mt-0.5 ${overdue ? 'text-expense font-semibold' : 'text-muted-foreground'}`}>
            {overdue ? 'Overdue' : `Due ${new Date(item.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          </p>
        </div>
      </Link>

      <RecurringActions id={item.id} isActive={item.is_active} />
    </div>
  )
}