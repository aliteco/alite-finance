// filepath: alite/src/app/(app)/transactions/[id]/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

  interface TransferDetail {
    id: string
    from_amount: number
    to_amount: number
    from_currency: string
    to_currency: string
    exchange_rate: number
    from_account: { name: string; currency: string } | null
    to_account: { name: string; currency: string } | null
  }

  let transferDetails: TransferDetail | null = null
  if (tx.transfer_id) {
    const { data: tf } = await supabase
      .from('transfers')
      .select(`
        id,
        from_amount,
        to_amount,
        from_currency,
        to_currency,
        exchange_rate,
        from_account:from_account_id ( name, currency ),
        to_account:to_account_id ( name, currency )
      `)
      .eq('id', tx.transfer_id)
      .maybeSingle()
    if (tf) {
      transferDetails = tf as unknown as TransferDetail
    }
  }

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

        {isTransfer && transferDetails && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-[#818cf8] uppercase tracking-[0.12em]">Transfer Breakdown</h4>
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Source Account</span>
                <span className="font-semibold text-foreground">
                  {transferDetails.from_account?.name ?? 'Unknown'} ({transferDetails.from_currency})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Destination Account</span>
                <span className="font-semibold text-foreground">
                  {transferDetails.to_account?.name ?? 'Unknown'} ({transferDetails.to_currency})
                </span>
              </div>
              <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Amount Debited</span>
                <span className="font-bold text-expense tabular-nums">
                  {formatCurrency(transferDetails.from_amount, transferDetails.from_currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Amount Credited</span>
                <span className="font-bold text-income tabular-nums">
                  {formatCurrency(transferDetails.to_amount, transferDetails.to_currency)}
                </span>
              </div>

              {transferDetails.from_currency !== transferDetails.to_currency && (
                <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 mt-3 text-center">
                  <div className="text-xs font-medium text-foreground flex items-center justify-center gap-1.5 flex-wrap">
                    <span>💱</span>
                    <span>
                      Cross-currency rate: <strong>1 {transferDetails.from_currency} = {transferDetails.exchange_rate} {transferDetails.to_currency}</strong>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                    Due to different currencies, the received amount is converted and credited to the target account.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

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