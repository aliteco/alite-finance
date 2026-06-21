// filepath: alite/src/app/(app)/recurring/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RecurringActions from '@/components/recurring-actions'

interface RecurringDetail {
  id: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  description: string
  frequency: string
  start_date: string
  next_due_date: string
  last_generated_date: string | null
  end_date: string | null
  is_active: boolean
  auto_generate: boolean
  accounts: { name: string } | null
  categories: { name: string; color: string | null; icon: string | null } | null
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly',
  monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly',
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function RecurringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(`
      id, type, amount, currency, description, frequency,
      start_date, next_due_date, last_generated_date, end_date, is_active, auto_generate,
      accounts ( name ),
      categories ( name, color, icon )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single<RecurringDetail>()

  if (error || !data) notFound()

  const { data: history } = await supabase
    .from('transactions')
    .select('id, date, base_currency_amount, currency')
    .eq('recurring_id', id)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(12)

  const isIncome = data.type === 'income'
  const overdue = data.is_active && new Date(data.next_due_date) < new Date(new Date().toDateString())

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        <Link
          href="/recurring"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Recurring
        </Link>

        <div className="rounded-2xl border border-border bg-card px-5 py-6 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-bold"
            style={{
              background: data.categories?.color ? `${data.categories.color}22` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
              color: data.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
            }}
            aria-hidden="true"
          >
            {data.categories?.icon ?? data.description.charAt(0).toUpperCase()}
          </div>
          <p className={`text-3xl font-extrabold tabular-nums tracking-tight ${isIncome ? 'text-income' : 'text-expense'}`}>
            {isIncome ? '+' : '−'}{formatCurrency(data.amount, data.currency)}
          </p>
          <p className="text-sm font-medium text-foreground mt-3">{data.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {FREQUENCY_LABELS[data.frequency] ?? data.frequency} · {data.accounts?.name ?? '—'}
          </p>
          {!data.is_active && (
            <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-1 rounded-full">
              Paused
            </span>
          )}
        </div>

        <dl className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          <Row label="Next due" value={overdue ? `${formatDate(data.next_due_date)} (overdue)` : formatDate(data.next_due_date)} alert={overdue} />
          <Row label="Started" value={formatDate(data.start_date)} />
          {data.end_date && <Row label="Ends" value={formatDate(data.end_date)} />}
          <Row label="Category" value={data.categories?.name ?? 'Uncategorized'} />
          <Row label="Auto-generate" value={data.auto_generate ? 'Enabled (server-side daily check)' : 'Manual only'} />
          {data.last_generated_date && <Row label="Last posted" value={formatDate(data.last_generated_date)} />}
        </dl>

        <div className="rounded-2xl border border-border bg-card px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Actions</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Record this cycle now or pause the rule.</p>
          </div>
          <RecurringActions id={data.id} isActive={data.is_active} />
        </div>

        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
            Posting history
          </p>
          {!history || history.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No transactions posted from this rule yet.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className={`flex items-center justify-between px-4 py-3 ${i < history.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <p className="text-xs font-medium text-foreground">{formatDate(h.date)}</p>
                  <p className={`text-xs font-bold tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
                    {isIncome ? '+' : '−'}{formatCurrency(h.base_currency_amount, h.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-xs font-medium text-right max-w-[60%] truncate ${alert ? 'text-expense font-semibold' : 'text-foreground'}`}>
        {value}
      </dd>
    </div>
  )
}