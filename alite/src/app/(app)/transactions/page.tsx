import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ExportLedgerButton from '@/components/export-ledger-button'
import { renderCategoryIcon } from '@/lib/icons'

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  savings: '🏛',
  credit_card: '💳',
  investment: '📈',
  other: '🗂',
}

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

  const [profileRes, txRes, accountsRes, allTxRes] = await Promise.all([
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

      if (filterType !== 'all') q = q.eq('type', filterType)
      if (filterAccount) q = q.eq('account_id', filterAccount)
      if (query) q = q.ilike('description', `%${query}%`)

      q = q
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      return q
    })(),

    supabase
      .from('accounts')
      .select('id, name, currency, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),

    (() => {
      let q = supabase
        .from('transactions')
        .select(`
          id, type, amount, base_currency_amount, currency,
          description, date, transfer_type,
          categories ( name ),
          accounts ( name )
        `)
        .eq('user_id', user.id)

      if (filterType !== 'all') q = q.eq('type', filterType)
      if (filterAccount) q = q.eq('account_id', filterAccount)
      if (query) q = q.ilike('description', `%${query}%`)

      return q
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
    })(),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const transactions = (txRes.data as unknown as Transaction[]) ?? []
  const exportTransactions = (allTxRes.data as unknown as Transaction[]) ?? []
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
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Ledger
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {totalCount} transaction{totalCount !== 1 ? 's' : ''}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {exportTransactions.length > 0 && <ExportLedgerButton transactions={exportTransactions} />}
            <Link
              href="/transactions/new"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <span>+</span>
              <span className="hidden sm:inline">New Transaction</span>
            </Link>
          </div>
        </div>

        {/* Split Grid Layout for Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Left panel: Search & Filters Tower (Sticky on Desktop) */}
          <div className="md:col-span-4 md:sticky md:top-6 space-y-6 bg-card/45 p-1 md:p-5 md:border md:border-border/60 md:bg-card md:rounded-2xl md:shadow-xs">
            
            <div className="space-y-4">
              <h3 className="hidden md:block text-xs font-bold text-muted-foreground uppercase tracking-wider">Dissect Ledger</h3>
              
              {/* Search */}
              <form action="/transactions" method="GET" className="relative">
                {filterType !== 'all' && <input type="hidden" name="type" value={filterType} />}
                {filterAccount && <input type="hidden" name="account" value={filterAccount} />}
                <label htmlFor="tx-search" className="sr-only">Search transactions by description</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    id="tx-search"
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search descriptions…"
                    className="w-full h-10 pl-9 rounded-xl text-sm bg-background border border-border"
                    aria-label="Search transactions"
                  />
                </div>
              </form>

              {/* Type Filters */}
              <div className="space-y-1.5">
                <p className="hidden md:block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Category Type</p>
                <div
                  className="flex rounded-xl p-1 gap-1 bg-muted/40 border border-border/20"
                  role="group"
                  aria-label="Filter by transaction type"
                >
                  {(['all', 'income', 'expense'] as const).map(t => (
                    <Link
                      key={t}
                      href={filterUrl({ type: t, page: '1' })}
                      aria-current={filterType === t ? 'true' : undefined}
                      className={`flex-1 h-8 rounded-lg text-xs font-semibold capitalize text-center leading-8 transition-all
                        ${filterType === t
                          ? t === 'income'
                            ? 'bg-card text-income shadow-xs'
                            : t === 'expense'
                            ? 'bg-card text-expense shadow-xs'
                            : 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Account Dropdowns */}
              {accounts.length > 1 && (
                <div className="space-y-1.5 overflow-hidden">
                  <p className="hidden md:block text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Select Wallet</p>
                  
                  {/* Mobile Horizontal scroll accounts */}
                  <div className="flex md:hidden gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Filter by account">
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

                  {/* Desktop Vertical Accounts Stack */}
                  <div className="hidden md:flex flex-col gap-1" role="group" aria-label="Filter by account (desktop)">
                    <Link
                      href={filterUrl({ account: '', page: '1' })}
                      aria-current={!filterAccount ? 'true' : undefined}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all
                        ${!filterAccount 
                          ? 'bg-primary/5 border border-primary/20 text-primary font-bold shadow-2xs' 
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent'}`}
                    >
                      <span>🌎 All accounts</span>
                      <span className="text-[10px] opacity-80 font-mono">Total</span>
                    </Link>
                    {accounts.map((a: { id: string; name: string; type: string; currency: string }) => (
                      <Link
                        key={a.id}
                        href={filterUrl({ account: a.id, page: '1' })}
                        aria-current={filterAccount === a.id ? 'true' : undefined}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all
                          ${filterAccount === a.id 
                            ? 'bg-primary/5 border border-primary/20 text-primary font-bold shadow-2xs' 
                            : 'hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent'}`}
                      >
                        <span className="truncate">{ACCOUNT_TYPE_ICONS[a.type] ?? '💳'} {a.name}</span>
                        <span className="text-[10px] tabular-nums tracking-wider uppercase font-mono">{a.currency}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Chronological Stream & Pagination */}
          <div className="md:col-span-8 space-y-6">
            
            {transactions.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl px-4 py-16 text-center shadow-xs">
                <p className="text-sm font-semibold text-foreground mb-1">No transaction items</p>
                <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
                  {filterType !== 'all' || filterAccount || query
                    ? 'No records match your selected parameters. Try resetting your search term or filtering criteria.'
                    : 'Get started on your budget bookkeeping by writing down your first financial ledger event today.'}
                </p>
                <Link 
                  href="/transactions/new" 
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Add Transaction →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([dateLabel, txs]) => (
                  <div key={dateLabel} className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1.5">
                      {dateLabel}
                    </p>
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                      {txs.map((tx, i) => {
                        const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
                        const isTransfer = tx.type === 'transfer'
                        const sign = isIncome ? '+' : '−'
                        const amtColor = isIncome ? 'text-income' : isTransfer ? 'text-[#818cf8]' : 'text-expense'
                        return (
                          <Link
                            href={`/transactions/${tx.id}`}
                            key={tx.id}
                            className={`flex items-center gap-4 px-4 py-4 hover:bg-muted/30 transition-colors ${i < txs.length - 1 ? 'border-b border-border' : ''}`}
                          >
                            <div
                              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-sm font-bold shrink-0 shadow-2xs"
                              style={{
                                background: tx.categories?.color ? `${tx.categories.color}1c` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
                                color: tx.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
                              }}
                            >
                              {isTransfer ? '⇄' : renderCategoryIcon(tx.categories?.icon, tx.categories?.name ?? 'U', 'w-4 h-4')}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {tx.description ?? tx.categories?.name ?? 'Transaction'}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate font-medium">
                                {tx.accounts?.name} · {tx.categories?.name ?? (isTransfer ? 'Transfer' : 'Uncategorized')}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className={`text-xs font-bold tabular-nums ${amtColor}`}>
                                {sign}{formatCurrency(tx.amount, tx.currency)}
                              </p>
                              {tx.currency !== baseCurrency && (
                                <p className="text-[9px] text-muted-foreground tabular-nums font-mono mt-0.5">
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
                  <nav className="flex items-center justify-between px-1.5 pt-4 border-t border-border/40" aria-label="Pagination">
                    <Link
                      href={filterUrl({ page: String(page - 1) })}
                      aria-disabled={page <= 1}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors border border-border/50 bg-card shadow-3xs
                        ${page <= 1 ? 'text-muted-foreground/30 pointer-events-none' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      ← Previous
                    </Link>
                    <span className="text-[11px] font-bold text-muted-foreground" aria-current="page">Page {page} of {totalPages}</span>
                    <Link
                      href={filterUrl({ page: String(page + 1) })}
                      aria-disabled={page >= totalPages}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors border border-border/50 bg-card shadow-3xs
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

      </div>
    </div>
  )
}
