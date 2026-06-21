// filepath: alite/src/app/(app)/accounts/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  color: string
  include_in_net_worth: boolean
}

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  base_currency_amount: number
  currency: string
  description: string | null
  date: string
  transfer_type: 'debit' | 'credit' | null
  categories: { name: string; color: string } | null
}

interface Profile {
  base_currency: string
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
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

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash', bank: 'Bank Account', savings: 'Savings Account',
  credit_card: 'Credit Card', investment: 'Investment', other: 'Other',
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, accountRes, txRes] = await Promise.all([
    supabase.from('profiles').select('base_currency').eq('id', user.id).single<Profile>(),
    supabase
      .from('accounts')
      .select('id, name, type, currency, balance, color, include_in_net_worth')
      .eq('id', id)
      .eq('user_id', user.id)
      .single<Account>(),
    supabase
      .from('transactions')
      .select(`
        id, type, amount, base_currency_amount, currency,
        description, date, transfer_type,
        categories ( name, color )
      `)
      .eq('account_id', id)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60),
  ])

  if (accountRes.error || !accountRes.data) notFound()

  const account = accountRes.data
  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const transactions = (txRes.data as unknown as Transaction[]) ?? []
  const grouped = groupByDate(transactions)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthTxs = transactions.filter(
    tx => new Date(tx.date) >= monthStart && (tx.type === 'income' || tx.type === 'expense')
  )
  const monthlyIn = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthlyOut = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        <div className="flex items-center justify-between">
          <Link
            href="/accounts"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Accounts
          </Link>
          <Link
            href={`/accounts/${id}/edit`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border focus-visible:ring-2"
          >
            Edit
          </Link>
        </div>

        <div className="rounded-2xl px-5 py-5 relative overflow-hidden border border-border bg-card">
          {account.color && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 70% 50% at 90% -10%, ${account.color}18 0%, transparent 70%)` }}
              aria-hidden="true"
            />
          )}

          <div className="flex items-start gap-3.5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
              style={{
                background: account.color ? `${account.color}22` : 'var(--muted)',
                color: account.color ?? 'var(--foreground)',
                border: `0.5px solid ${account.color ?? 'transparent'}44`,
              }}
              aria-hidden="true"
            >
              {account.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight truncate">{account.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
                {!account.include_in_net_worth && (
                  <span className="ml-1.5 opacity-70">· excluded from net worth</span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">Balance</p>
            <p className={`text-4xl font-extrabold tracking-tight tabular-nums leading-none ${account.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>

          <div className="mt-5 pt-4 grid grid-cols-2 gap-4 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">This month in</p>
              <p className="text-sm font-semibold tabular-nums text-income">+{formatCurrency(monthlyIn, account.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">This month out</p>
              <p className="text-sm font-semibold tabular-nums text-expense">−{formatCurrency(monthlyOut, account.currency)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/transactions/new?account=${id}&type=expense`}
            className="flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold text-expense transition-colors hover:opacity-80 focus-visible:ring-2"
            style={{ background: 'rgba(248,113,113,0.08)', border: '0.5px solid rgba(248,113,113,0.2)' }}
          >
            <span className="text-base" aria-hidden="true">−</span>
            Add expense
          </Link>
          <Link
            href={`/transactions/new?account=${id}&type=income`}
            className="flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold text-income transition-colors hover:opacity-80 focus-visible:ring-2"
            style={{ background: 'rgba(52,211,153,0.08)', border: '0.5px solid rgba(52,211,153,0.2)' }}
          >
            <span className="text-base" aria-hidden="true">+</span>
            Add income
          </Link>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Transactions</p>
            {transactions.length > 0 && (
              <Link href={`/transactions?account=${id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium focus-visible:ring-2 rounded">
                See all →
              </Link>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl px-4 py-12 text-center border border-border bg-card">
              <p className="text-sm text-muted-foreground mb-2">No transactions yet</p>
              <Link href={`/transactions/new?account=${id}`} className="text-xs text-primary font-medium focus-visible:ring-2 rounded">
                Add first transaction →
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([dateLabel, txs]) => (
                <div key={dateLabel}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-0.5">
                    {dateLabel}
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-border bg-card">
                    {txs.map((tx, i) => (
                      <TxRow key={tx.id} tx={tx} baseCurrency={baseCurrency} accountCurrency={account.currency} hasBorder={i < txs.length - 1} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

function TxRow({
  tx,
  baseCurrency,
  hasBorder,
}: {
  tx: Transaction
  baseCurrency: string
  accountCurrency: string
  hasBorder: boolean
}) {
  const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
  const isTransfer = tx.type === 'transfer'
  const category = tx.categories as unknown as { name: string; color: string } | null

  const amtColor = isIncome ? 'text-income' : isTransfer ? 'text-[#818cf8]' : 'text-expense'
  const dotBg = isIncome ? 'var(--income-muted)' : isTransfer ? 'rgba(129,140,248,0.12)' : 'var(--expense-muted)'
  const dotColor = isIncome ? 'var(--income)' : isTransfer ? '#818cf8' : 'var(--expense)'
  const sign = isIncome ? '+' : '−'
  const label = tx.description ?? category?.name ?? (isTransfer ? 'Transfer' : 'Transaction')

  return (
    <Link
      href={isTransfer ? '/transactions' : `/transactions/${tx.id}`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors focus-visible:ring-2"
      style={hasBorder ? { borderBottom: '0.5px solid var(--border)' } : {}}
    >
      <div
        className="w-8 h-8 rounded-[9px] flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: category?.color ? `${category.color}22` : dotBg, color: category?.color ?? dotColor }}
        aria-hidden="true"
      >
        {isTransfer ? '⇄' : (category?.name ?? label).charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate leading-tight">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isTransfer ? (tx.transfer_type === 'debit' ? 'Transfer out' : 'Transfer in') : category?.name ?? 'Uncategorized'}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-xs font-bold tabular-nums ${amtColor}`}>
          {sign}{new Intl.NumberFormat('en-US', { style: 'currency', currency: tx.currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(tx.amount)}
        </p>
        {tx.currency !== baseCurrency && (
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(tx.base_currency_amount)}
          </p>
        )}
      </div>
    </Link>
  )
}