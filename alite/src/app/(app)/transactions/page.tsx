import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  base_currency_amount: number
  currency: string
  description: string | null
  date: string
  transfer_type: 'debit' | 'credit' | null
  categories: { name: string; color: string; icon: string } | null
  accounts: { name: string } | null
}

type FilterType = 'all' | 'income' | 'expense'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function groupByDate(txs: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const label = formatDate(tx.date)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(tx)
  }
  return Array.from(map.entries())
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string; account?: string; q?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filterType = (params.type ?? 'all') as FilterType
  const filterAccount = params.account ?? ''
  const query = (params.q ?? '').trim()
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const PAGE_SIZE = 30
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [profileRes, txRes, accountsRes] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),

    (() => {
      let q = supabase
        .from('transactions')
        .select(`
          id, type, amount, base_currency_amount, currency,
          description, date, transfer_type,
          categories ( name, color, icon ),
          accounts ( name )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filterType !== 'all') q = q.eq('type', filterType)
      if (filterAccount) q = q.eq('account_id', filterAccount)
      if (query) q = q.ilike('description', `%${query}%`)

      return q
    })(),

    supabase
      .from('accounts')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const transactions = (txRes.data as unknown as Transaction[]) ?? []
  const totalCount = txRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const accounts = accountsRes.data ?? []
  const grouped = groupByDate(transactions)

  function filterUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      ...(filterType !== 'all' ? { type: filterType } : {}),
      ...(filterAccount ? { account: filterAccount } : {}),
      ...(query ? { q: query } : {}),
      ...overrides,
    })
    return `/transactions?${p.toString()}`
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Transactions
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {totalCount} total
            </h1>
          </div>
          <Link
            href="/transactions/new"
            className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity shrink-0"
          >
            + New
          </Link>
        </div>

        {/* ── Search ── */}
        <form action="/transactions" method="GET" className="relative">
          {filterType !== 'all' && <input type="hidden" name="type" value={filterType} />}
          {filterAccount && <input type="hidden" name="account" value={filterAccount} />}
          <label htmlFor="tx-search" className="sr-only">Search transactions by description</label>
          <input
            id="tx-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by description…"
            className="w-full h-10 rounded-xl text-sm"
            aria-label="Search transactions"
          />
        </form>

        {/* ── Filters ── */}
        <div className="space-y-2">
          <div
            className="flex rounded-xl p-1 gap-1"
            role="group"
            aria-label="Filter by transaction type"
          >
            {(['all', 'income', 'expense'] as const).map(t => (
              <Link
                key={t}
                href={filterUrl({ type: t, page: '1' })}
                aria-current={filterType === t ? 'true' : undefined}
                className={`flex-1 h-8 rounded-lg text-xs font-semibold capitalize text-center leading-8 transition-colors bg-muted
                  ${filterType === t
                    ? t === 'income'
                      ? 'bg-card text-income'
                      : t === 'expense'
                      ? 'bg-card text-expense'
                      : 'bg-card text-foreground'
                    : 'text-muted-foreground'
                  }`}
              >
                {t}
              </Link>
            ))}
          </div>

          {accounts.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Filter by account">
              <Link
                href={filterUrl({ account: '', page: '1' })}
                aria-current={!filterAccount ? 'true' : undefined}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors
                  ${!filterAccount ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
              >
                All accounts
              </Link>
              {accounts.map(a => (
                <Link
                  key={a.id}
                  href={filterUrl({ account: a.id, page: '1' })}
                  aria-current={filterAccount === a.id ? 'true' : undefined}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors
                    ${filterAccount === a.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}
                >
                  {a.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── List ── */}
        {transactions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              {filterType !== 'all' || filterAccount || query
                ? 'No transactions match these filters.'
                : 'No transactions yet.'}
            </p>
            <Link href="/transactions/new" className="text-xs text-primary font-medium">
              Add transaction →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([dateLabel, txs]) => (
              <div key={dateLabel}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  {dateLabel}
                </p>
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  {txs.map((tx, i) => {
                    const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
                    const isTransfer = tx.type === 'transfer'
                    const sign = isIncome ? '+' : '−'
                    const amtColor = isIncome ? 'text-income' : isTransfer ? 'text-[#818cf8]' : 'text-expense'
                    return (
                      <Link
                        href={`/transactions/${tx.id}`}
                        key={tx.id}
                        className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors ${i < txs.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        <div
                          className="w-8 h-8 rounded-[9px] flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: tx.categories?.color ? `${tx.categories.color}22` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
                            color: tx.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
                          }}
                        >
                          {isTransfer ? '⇄' : (tx.categories?.icon ?? (tx.categories?.name ?? 'U').charAt(0).toUpperCase())}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {tx.description ?? tx.categories?.name ?? 'Transaction'}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {tx.accounts?.name} · {tx.categories?.name ?? (isTransfer ? 'Transfer' : 'Uncategorized')}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`text-xs font-semibold tabular-nums ${amtColor}`}>
                            {sign}{formatCurrency(tx.amount, tx.currency)}
                          </p>
                          {tx.currency !== baseCurrency && (
                            <p className="text-[10px] text-muted-foreground tabular-nums">
                              {formatCurrency(tx.base_currency_amount, baseCurrency)}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <nav className="flex items-center justify-between px-1" aria-label="Pagination">
                <Link
                  href={filterUrl({ page: String(page - 1) })}
                  aria-disabled={page <= 1}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors
                    ${page <= 1 ? 'text-muted-foreground/30 pointer-events-none' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  ← Previous
                </Link>
                <span className="text-[11px] text-muted-foreground" aria-current="page">{page} of {totalPages}</span>
                <Link
                  href={filterUrl({ page: String(page + 1) })}
                  aria-disabled={page >= totalPages}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors
                    ${page >= totalPages ? 'text-muted-foreground/30 pointer-events-none' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Next →
                </Link>
              </nav>
            )}
          </div>
        )}

      </div>
    </div>
  )
}