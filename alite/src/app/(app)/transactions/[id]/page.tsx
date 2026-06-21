// filepath: alite/src/app/(app)/transactions/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ICONS } from '@/lib/icons'
import DeleteTransactionButton from '@/components/delete-transaction-button'

interface TxDetail {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  base_currency_amount: number
  currency: string
  exchange_rate_used: number
  description: string | null
  notes: string | null
  date: string
  transfer_id: string | null
  transfer_type: 'debit' | 'credit' | null
  accounts: { name: string; color: string } | null
  categories: { name: string; color: string; icon: string } | null
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tx, error } = await supabase
    .from('transactions')
    .select(`
      id, type, amount, base_currency_amount, currency, exchange_rate_used,
      description, notes, date, transfer_id, transfer_type,
      accounts ( name, color ),
      categories ( name, color, icon )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single<TxDetail>()

  if (error || !tx) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('base_currency')
    .eq('id', user.id)
    .single()

  const baseCurrency = profile?.base_currency ?? 'IDR'
  const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.transfer_type === 'credit')
  const isTransfer = tx.type === 'transfer'

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">

        <div className="flex items-center justify-between">
          <Link
            href="/transactions"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Transactions
          </Link>
          {!isTransfer && (
            <Link
              href={`/transactions/${id}/edit`}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border focus-visible:ring-2"
            >
              Edit
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card px-5 py-6 text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-bold"
            style={{
              background: tx.categories?.color ? `${tx.categories.color}22` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
              color: tx.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
            }}
            aria-hidden="true"
          >
            {isTransfer ? '⇄' : (tx.categories?.icon ?? '•')}
          </div>
          <p
            className={`text-3xl font-extrabold tabular-nums tracking-tight ${
              isIncome ? 'text-income' : isTransfer ? 'text-[#818cf8]' : 'text-expense'
            }`}
          >
            {isIncome ? '+' : '−'}{formatCurrency(tx.amount, tx.currency)}
          </p>
          {tx.currency !== baseCurrency && (
            <p className="text-xs text-muted-foreground mt-1">
              ≈ {formatCurrency(tx.base_currency_amount, baseCurrency)} · rate {tx.exchange_rate_used}
            </p>
          )}
          <p className="text-sm font-medium text-foreground mt-3">
            {tx.description ?? tx.categories?.name ?? 'Transaction'}
          </p>
        </div>

        <dl className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          <Row label="Date" value={new Date(tx.date).toLocaleDateString('en-US', { dateStyle: 'long' })} />
          <Row label="Account" value={tx.accounts?.name ?? '—'} />
          {!isTransfer && <Row label="Category" value={tx.categories?.name ?? 'Uncategorized'} />}
          {isTransfer && <Row label="Direction" value={tx.transfer_type === 'debit' ? 'Transfer out' : 'Transfer in'} />}
          {tx.notes && <Row label="Notes" value={tx.notes} />}
        </dl>

        <DeleteTransactionButton
          transactionId={tx.id}
          transferId={tx.transfer_id}
          isTransfer={isTransfer}
        />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium text-foreground text-right max-w-[60%] truncate">{value}</dd>
    </div>
  )
}