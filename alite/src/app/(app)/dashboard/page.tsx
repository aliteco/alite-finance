import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  base_currency: string
}

interface Account {
  id: string
  name: string
  currency: string
  balance: number
  type: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  base_currency_amount: number
  currency: string
  description: string | null
  created_at: string
  categories: { name: string } | null
  accounts: { name: string; currency: string } | null
}

interface MonthlyMetrics {
  income: number
  expense: number
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDashboardData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Run queries in parallel
  const [profileRes, accountsRes, monthlyTxRes, recentTxRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single<Profile>(),

    supabase
      .from('accounts')
      .select('id, name, currency, balance, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('balance', { ascending: false }),

    // Monthly income/expense — exclude transfer legs
    supabase
      .from('transactions')
      .select('type, base_currency_amount')
      .eq('user_id', user.id)
      .in('type', ['income', 'expense'])
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd)
      .is('transfer_id', null),        // exclude transfer legs

    // Recent 15 transactions (non-transfer)
    supabase
      .from('transactions')
      .select(`
        id, type, amount, base_currency_amount, currency,
        description, created_at,
        categories ( name ),
        accounts ( name, currency )
      `)
      .eq('user_id', user.id)
      .in('type', ['income', 'expense'])
      .is('transfer_id', null)
      .order('created_at', { ascending: false })
      .limit(15),
  ])

  const profile = profileRes.data ?? { base_currency: 'IDR' }
  const accounts: Account[] = accountsRes.data ?? []
  const monthlyTxs = monthlyTxRes.data ?? []
  const recentTxs: Transaction[] = (recentTxRes.data as unknown as Transaction[]) ?? []

  // Net worth: sum of all account balances already stored in base_currency_amount
  const netWorth = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0)

  // Monthly aggregates from base_currency_amount (immutable historical)
  const monthly: MonthlyMetrics = monthlyTxs.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.base_currency_amount ?? 0
      if (tx.type === 'expense') acc.expense += tx.base_currency_amount ?? 0
      return acc
    },
    { income: 0, expense: 0 }
  )

  return { profile, accounts, monthly, recentTxs, user, netWorth }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  currency,
  accent,
}: {
  label: string
  value: number
  currency: string
  accent?: 'income' | 'expense' | 'neutral'
}) {
  const colorMap = {
    income: 'text-income',
    expense: 'text-expense',
    neutral: 'text-foreground',
  }
  const color = colorMap[accent ?? 'neutral']

  return (
    <div className="bg-card border border-border rounded-2xl px-4 py-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-xl font-semibold tabular-nums leading-tight ${color}`}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  )
}

function TxRow({ tx, baseCurrency }: { tx: Transaction; baseCurrency: string }) {
  const isIncome = tx.type === 'income'
  const category = tx.categories?.name ?? 'Uncategorized'
  const accountName = tx.accounts?.name ?? '—'
  const sign = isIncome ? '+' : '−'
  const amtColor = isIncome ? 'text-income' : 'text-expense'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      {/* Category dot */}
      <div
        className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold
          ${isIncome ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}
      >
        {category.charAt(0).toUpperCase()}
      </div>

      {/* Description + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {tx.description ?? category}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {accountName} · {formatDate(tx.created_at)}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold tabular-nums ${amtColor}`}>
          {sign}{formatCurrency(tx.amount, tx.currency)}
        </p>
        {tx.currency !== baseCurrency && (
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {formatCurrency(tx.base_currency_amount, baseCurrency)}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { profile, accounts, monthly, recentTxs, netWorth } = await getDashboardData()
  const { base_currency } = profile
  const savings = monthly.income - monthly.expense
  const now = new Date()
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  // Savings rate: can legitimately be negative (spent more than earned this month).
  // Previously this was clamped to 0 before display, which silently hid overspending.
  const savingsRate = monthly.income > 0 ? (savings / monthly.income) * 100 : 0
  const isOverspent = savingsRate < 0
  const displayRate = Math.round(savingsRate)
  // Bar fill: clamp magnitude to 100 for width purposes only, never hide the sign.
  const barWidthPct = Math.min(100, Math.abs(savingsRate))

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        {/* ── Net Worth ── */}
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Net Worth
          </p>
          <h2 className="text-4xl font-bold tabular-nums tracking-tight text-foreground leading-none">
            {formatCurrency(netWorth, base_currency)}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {base_currency} · {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </section>

        {/* ── Monthly summary ── */}
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {monthLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Income" value={monthly.income} currency={base_currency} accent="income" />
            <MetricCard label="Expense" value={monthly.expense} currency={base_currency} accent="expense" />
            <MetricCard label="Saved" value={savings} currency={base_currency} accent={savings >= 0 ? 'income' : 'expense'} />
          </div>
        </section>

        {/* ── Savings rate bar ── */}
        {monthly.income > 0 && (
          <section className="bg-card border border-border rounded-2xl px-4 py-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {isOverspent ? 'Overspent this month' : 'Savings rate'}
              </span>
              <span className={`text-xs font-semibold tabular-nums ${isOverspent ? 'text-expense' : 'text-foreground'}`}>
                {isOverspent ? '−' : ''}{Math.abs(displayRate)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverspent ? 'bg-expense' : 'bg-income'}`}
                style={{ width: `${barWidthPct}%` }}
              />
            </div>
            {isOverspent && (
              <p className="text-[11px] text-muted-foreground mt-2">
                You spent {Math.abs(displayRate)}% more than you earned this month.
              </p>
            )}
          </section>
        )}

        {/* ── Accounts strip ── */}
        {accounts.length > 0 && (
        <section>
            <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Accounts</p>
            <a href="/accounts" className="text-xs text-primary font-medium">See all</a>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory">
            {accounts.map((account) => (
                <a
                key={account.id}
                href={`/accounts/${account.id}`}
                className="snap-start shrink-0 bg-card border border-border rounded-2xl px-4 py-3 w-44 flex flex-col gap-2 active:opacity-70 transition"
                >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {account.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{account.currency}</span>
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight truncate">{account.name}</p>
                <p className="text-base font-bold tabular-nums text-foreground">
                    {formatCurrency(account.balance, account.currency)}
                </p>
                </a>
            ))}
            </div>
        </section>
        )}

        {/* ── Recent transactions ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</p>
            <a href="/transactions" className="text-xs text-primary font-medium">See all</a>
          </div>

          {recentTxs.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No transactions yet</p>
              <a href="/transactions/new" className="text-xs text-primary font-medium mt-1 block">
                Add your first transaction
              </a>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl px-4">
              {recentTxs.map(tx => (
                <TxRow key={tx.id} tx={tx} baseCurrency={base_currency} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}