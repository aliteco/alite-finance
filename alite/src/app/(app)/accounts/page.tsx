import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string
  name: string
  type: string
  currency: string
  balance: number
  color: string
  is_active: boolean
  include_in_net_worth: boolean
}

interface Profile {
  base_currency: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank',
  savings: 'Savings',
  credit_card: 'Credit Card',
  investment: 'Investment',
  other: 'Other',
}

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  savings: '🏛',
  credit_card: '💳',
  investment: '📈',
  other: '🗂',
}

// Group accounts by type for a cleaner layout
function groupByType(accounts: Account[]): Map<string, Account[]> {
  const map = new Map<string, Account[]>()
  const order = ['bank', 'savings', 'cash', 'credit_card', 'investment', 'other']
  for (const type of order) {
    const group = accounts.filter(a => a.type === type)
    if (group.length > 0) map.set(type, group)
  }
  return map
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, accountsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single(),

    supabase
      .from('accounts')
      .select('id, name, type, currency, balance, color, is_active, include_in_net_worth')
      .eq('user_id', user.id)
      .order('type')
      .order('name'),
  ])

  const baseCurrency = (profileRes.data as unknown as Profile)?.base_currency ?? 'IDR'
  const accounts: Account[] = accountsRes.data ?? []

  const activeAccounts = accounts.filter(a => a.is_active)
  const netWorthAccounts = activeAccounts.filter(a => a.include_in_net_worth)

  // NOTE: This is a simplified sum in account currency (not converted to base).
  // For multi-currency accuracy across mixed-currency accounts, the dashboard's
  // base_currency_amount-derived net worth is authoritative; this is a quick view.
  const netWorth = netWorthAccounts.reduce((sum, a) => sum + (a.balance ?? 0), 0)

  const grouped = groupByType(activeAccounts)
  const hasMixedCurrencies = new Set(netWorthAccounts.map(a => a.currency)).size > 1

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        {/* ── Header ── */}
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Accounts
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {activeAccounts.length} wallet{activeAccounts.length !== 1 ? 's' : ''}
            </h1>
          </div>
          <Link
            href="/accounts/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Add account"
          >
            <span>+</span>
            <span className="hidden sm:inline">Add Wallet</span>
          </Link>
        </div>

        {accounts.length === 0 ? (
          <EmptyState />
        ) : (
          /* Desktop responsive split grid */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
            
            {/* Left side panel: Net Worth & summary subtotals (sticky on desktop) */}
            <div className="md:col-span-5 md:sticky md:top-6 space-y-6">
              
              {/* Net Worth Summary */}
              <div
                className="rounded-2xl border px-6 py-6 relative overflow-hidden shadow-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse 65% 55% at 80% -10%, rgba(52,211,153,0.08) 0%, transparent 70%)',
                  }}
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1 text-muted-foreground">
                  Net Worth
                </p>
                <p className="text-4xl font-extrabold tracking-tight tabular-nums leading-none text-foreground">
                  {formatCurrency(netWorth, baseCurrency)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {baseCurrency} · {netWorthAccounts.length} account{netWorthAccounts.length !== 1 ? 's' : ''} in net worth
                  {hasMixedCurrencies && ' · mixed currencies, not converted'}
                </p>

                {activeAccounts.length > 0 && (
                  <div
                    className="mt-6 pt-5 grid grid-cols-2 gap-x-4 gap-y-4"
                    style={{ borderTop: '0.5px solid var(--border)' }}
                  >
                    {Array.from(grouped.entries()).map(([type, group]) => {
                      const subtotal = group.reduce((s, a) => s + (a.balance ?? 0), 0)
                      return (
                        <div key={type} className="bg-muted/10 p-2.5 rounded-xl border border-border/40">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5 font-medium truncate">
                            {ACCOUNT_TYPE_LABELS[type] ?? type}
                          </p>
                          <p className="text-sm font-bold tabular-nums text-foreground">
                            {formatCurrency(subtotal, baseCurrency)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="hidden md:block rounded-2xl bg-muted/20 border border-border/30 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Asset Allocation Mode</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  These summaries reflect your active financial balances. Keep accounts updated by recording new bank transfers, income items, and expenses.
                </p>
              </div>

            </div>

            {/* Right side list: Account Groups */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-6">
                {Array.from(grouped.entries()).map(([type, group]) => (
                  <AccountGroup
                    key={type}
                    type={type}
                    accounts={group}
                  />
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ─── Account Group ─────────────────────────────────────────────────────────────

function AccountGroup({
  type,
  accounts,
}: {
  type: string
  accounts: Account[]
}) {
  return (
    <section aria-labelledby={`group-${type}`}>
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <span className="text-base leading-none" aria-hidden="true">{ACCOUNT_TYPE_ICONS[type] ?? '🗂'}</span>
        <p id={`group-${type}`} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">
          {ACCOUNT_TYPE_LABELS[type] ?? type}
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: '0.5px solid var(--border)',
          background: 'var(--card)',
        }}
      >
        {accounts.map((account, i) => (
          <AccountRow
            key={account.id}
            account={account}
            hasBorder={i < accounts.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Account Row ───────────────────────────────────────────────────────────────

function AccountRow({
  account,
  hasBorder,
}: {
  account: Account
  hasBorder: boolean
}) {
  const isNegative = account.balance < 0

  return (
    <Link
      href={`/accounts/${account.id}`}
      className="flex items-center gap-3.5 px-4 py-4 transition-colors active:opacity-70 hover:bg-muted/40 focus-visible:bg-muted/40"
      style={
        hasBorder
          ? { borderBottom: '0.5px solid var(--border)' }
          : {}
      }
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
        style={{
          background: account.color
            ? `${account.color}22`
            : 'var(--muted)',
          color: account.color ?? 'var(--muted-foreground)',
          border: `0.5px solid ${account.color ?? 'transparent'}44`,
        }}
        aria-hidden="true"
      >
        {account.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {account.name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {account.currency}
          {!account.include_in_net_worth && (
            <span className="ml-1.5 text-muted-foreground/70">· excluded</span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <p
          className={`text-sm font-bold tabular-nums ${
            isNegative ? 'text-expense' : 'text-foreground'
          }`}
        >
          {formatCurrency(account.balance, account.currency)}
        </p>
        <svg
          width="6"
          height="10"
          viewBox="0 0 6 10"
          fill="none"
          className="text-muted-foreground/40"
          aria-hidden="true"
        >
          <path
            d="M1 1l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  )
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="rounded-2xl px-6 py-14 text-center"
      style={{
        border: '0.5px solid var(--border)',
        background: 'var(--card)',
      }}
    >
      <div className="text-4xl mb-4" aria-hidden="true">🏦</div>
      <p className="text-sm font-semibold text-foreground mb-1">No accounts yet</p>
      <p className="text-xs text-muted-foreground mb-5">
        Add your first bank account or wallet to start tracking your net worth.
      </p>
      <Link
        href="/accounts/new"
        className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        + Add account
      </Link>
    </div>
  )
}