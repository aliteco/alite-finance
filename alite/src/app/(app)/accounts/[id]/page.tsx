// filepath: alite/src/app/(app)/accounts/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface AccountDetail {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  color: string
  icon: string
  is_active: boolean
  include_in_net_worth: boolean
  created_at: string
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
  categories: { name: string; color: string | null; icon: string | null } | null
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  savings: 'Savings',
  credit_card: 'Credit Card',
  investment: 'Investment',
  other: 'Other',
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  const [accountRes, profileRes, txRes, monthRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, type, currency, balance, color, icon, is_active, include_in_net_worth, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single<AccountDetail>(),

    supabase.from('profiles').select('base_currency').eq('id', user.id).single(),

    supabase
      .from('transactions')
      .select(`
        id, type, amount, base_currency_amount, currency,
        description, date, transfer_type,
        categories ( name, color, icon )
      `)
      .eq('user_id', user.id)
      .eq('account_id', id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(25),

    (() => {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      return supabase
        .from('transactions')
        .select('type, base_currency_amount, transfer_id')
        .eq('user_id', user.id)
        .eq('account_id', id)
        .gte('date', monthStart)
    })(),
  ])

  if (accountRes.error || !accountRes.data) notFound()

  const account = accountRes.data
  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const transactions = (txRes.data as unknown as Transaction[]) ?? []

  const monthRows = monthRes.data ?? []
  const monthIncome = monthRows
    .filter(r => r.type === 'income' && !r.transfer_id)
    .reduce((s, r) => s + (r.base_currency_amount || 0), 0)
  const monthExpense = monthRows
    .filter(r => r.type === 'expense' && !r.transfer_id)
    .reduce((s, r) => s + (r.base_currency_amount || 0), 0)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/accounts"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Accounts
          </Link>
          <Link
            href={`/accounts/${account.id}/edit`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border focus-visible:ring-2"
          >
            Edit
          </Link>
        </div>

        {/* Hero balance card */}
        <div className="rounded-2xl border border-border bg-card px-5 py-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${account.color || '#6366f1'}18 0%, transparent 70%)` }}
            aria-hidden="true"
          />
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-bold"
            style={{ background: `${account.color || '#6366f1'}22`, color: account.color || '#6366f1' }}
            aria-hidden="true"
          >
            {account.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-sm font-semibold text-foreground">{account.name}</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {ACCOUNT_TYPE_LABELS[account.type] ?? account.type} · {account.currency}
            {!account.is_active && <span className="ml-1.5 text-expense">· Archived</span>}
            {!account.include_in_net_worth && <span className="ml-1.5">· Excluded from net worth</span>}
          </p>
          <p className={`text-4xl font-extrabold tabular-nums tracking-tight mt-4 ${account.balance < 0 ? 'text-expense' : 'text-foreground'}`}>
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>

        {/* This month summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Income (mo.)</p>
            <p className="text-sm font-bold tabular-nums text-income">
              +{formatCurrency(monthIncome, account.currency)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl px-4 py-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Expense (mo.)</p>
            <p className="text-sm font-bold tabular-nums text-expense">
              −{formatCurrency(monthExpense, account.currency)}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/transactions/new?account=${account.id}`}
            className="h-11 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            + New transaction
          </Link>
          <Link
            href={`/transactions?account=${account.id}`}
            className="h-11 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center focus-visible:ring-2"
          >
            View all activity
          </Link>
        </div>

        {/* Recent transactions */}
        <section>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
            Recent activity
          </p>
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground mb-2">No transactions on this account yet.</p>
              <Link href={`/transactions/new?account=${account.id}`} className="text-xs text-primary font-medium">
                Add the first one →
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {transactions.map((tx, i) => {
                const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
                const isTransfer = tx.type === 'transfer'
                const color = tx.categories?.color || (isIncome ? 'var(--income)' : 'var(--expense)')
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${i < transactions.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div
                      className="w-8 h-8 rounded-[9px] flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: `${color}1c`, color }}
                      aria-hidden="true"
                    >
                      {isTransfer ? '⇄' : (tx.categories?.icon ?? (tx.categories?.name ?? 'U').charAt(0).toUpperCase())}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {tx.description ?? tx.categories?.name ?? 'Transaction'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold tabular-nums ${isIncome ? 'text-income' : isTransfer ? 'text-[#818cf8]' : 'text-expense'}`}>
                        {isIncome ? '+' : '−'}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      {tx.currency !== baseCurrency && (
                        <p className="text-[10px] text-muted-foreground tabular-nums">
                          {formatCurrency(tx.base_currency_amount, baseCurrency)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}