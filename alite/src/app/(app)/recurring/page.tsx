import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecurringActions from '@/components/recurring-actions'

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

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(`
      id, type, amount, currency, description, frequency,
      next_due_date, end_date, is_active, auto_generate,
      accounts ( name ),
      categories ( name, color, icon )
    `)
    .eq('user_id', user.id)
    .order('is_active', { ascending: false })
    .order('next_due_date', { ascending: true })

  const rows = (data as unknown as RecurringRow[]) ?? []
  const active = rows.filter(r => r.is_active)
  const paused = rows.filter(r => !r.is_active)
  const overdueCount = active.filter(r => isOverdue(r.next_due_date)).length

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-end justify-between">
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
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-light hover:opacity-90 transition-opacity shrink-0"
            aria-label="Create recurring transaction"
          >
            +
          </Link>
        </div>

        {error && (
          <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
            Couldn&apos;t load recurring transactions: {error.message}
          </p>
        )}

        {rows.length === 0 && !error ? (
          <div className="rounded-2xl px-6 py-14 text-center border border-border bg-card">
            <div className="text-4xl mb-4" aria-hidden="true">🔁</div>
            <p className="text-sm font-semibold text-foreground mb-1">No recurring transactions</p>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
              Set up rent, salary, or subscriptions once and log them with one tap each cycle.
            </p>
            <Link
              href="/recurring/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              + Add recurring
            </Link>
          </div>
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
          <p className="text-xs font-medium text-foreground mb-1">Heads up</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recurring entries don&apos;t post automatically yet — tap &quot;Record now&quot; on a due item
            to create its transaction and advance the schedule.
          </p>
        </div>

      </div>
    </div>
  )
}

function RecurringRowItem({ item, hasBorder }: { item: RecurringRow; hasBorder: boolean }) {
  const overdue = item.is_active && isOverdue(item.next_due_date)
  const isIncome = item.type === 'income'

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${hasBorder ? 'border-b border-border' : ''}`}>
      <div
        className="w-9 h-9 rounded-[9px] flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background: item.categories?.color ? `${item.categories.color}22` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
          color: item.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
        }}
        aria-hidden="true"
      >
        {item.categories?.icon ?? item.description.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {item.description}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {item.accounts?.name ?? '—'} · {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-bold tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '−'}{formatCurrency(item.amount, item.currency)}
        </p>
        <p className={`text-[10px] mt-0.5 ${overdue ? 'text-expense font-semibold' : 'text-muted-foreground'}`}>
          {overdue ? 'Overdue' : `Due ${new Date(item.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </p>
      </div>

      <RecurringActions id={item.id} isActive={item.is_active} />
    </div>
  )
}