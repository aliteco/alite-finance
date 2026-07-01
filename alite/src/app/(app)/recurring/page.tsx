// filepath: alite/src/app/(app)/recurring/page.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import RecurringActions from '@/components/recurring-actions'
import CatchUpOverdueButton from '@/components/catch-up-overdue-button'
import PageLoadingSkeleton from '@/components/page-loading-skeleton'
import { renderCategoryIcon } from '@/lib/icons'
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'
import {
  Search,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react'

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

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

type TabId = 'all' | 'active' | 'paused' | 'overdue'

function isOverdue(nextDue: string) {
  return new Date(nextDue) < new Date(new Date().toDateString())
}

function getYearlyProjection(amount: number, frequency: string) {
  switch (frequency) {
    case 'daily': return amount * 365
    case 'weekly': return amount * 52
    case 'biweekly': return amount * 26
    case 'monthly': return amount * 12
    case 'quarterly': return amount * 4
    case 'yearly': return amount
    default: return amount
  }
}

export default function RecurringPage() {
  const router = useRouter()
  const [rows, setRows] = useState<RecurringRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [privacyEnabled, setPrivacyEnabled] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchRecurring() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data, error: err } = await supabase
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

        if (err) throw err
        if (active) setRows((data as unknown as RecurringRow[]) ?? [])
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to fetch recurring rules')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchRecurring()

    const checkPrivacy = () => {
      setPrivacyEnabled(localStorage.getItem('alite_privacy_mode') === 'true')
    }
    checkPrivacy()
    window.addEventListener('alite_privacy_changed', checkPrivacy)
    return () => {
      active = false
      window.removeEventListener('alite_privacy_changed', checkPrivacy)
    }
  }, [router])

  const wrapPrivacy = (val: string) => (privacyEnabled ? '••••••' : val)

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency

    return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`
  }

  const active = useMemo(() => rows.filter(r => r.is_active), [rows])
  const overdueRules = useMemo(() => active.filter(r => isOverdue(r.next_due_date)), [active])
  const overdueCount = overdueRules.length

  const monthlyOutflow = useMemo(() => {
    return active
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => {
        const monthly =
          r.frequency === 'daily' ? r.amount * 30 :
          r.frequency === 'weekly' ? r.amount * 4.33 :
          r.frequency === 'biweekly' ? r.amount * 2.17 :
          r.frequency === 'quarterly' ? r.amount / 3 :
          r.frequency === 'yearly' ? r.amount / 12 :
          r.amount
        return sum + monthly
      }, 0)
  }, [active])

  const upcomingBills = useMemo(() => {
    const today = new Date(new Date().toDateString())
    return active
      .filter(r => r.type === 'expense')
      .map(r => {
        const dueDate = new Date(r.next_due_date)
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return {
          ...r,
          daysLeft,
          dueDateStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }
      })
      .filter(item => item.daysLeft >= 0 && item.daysLeft <= 30)
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }, [active])

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const tabMatch =
        activeTab === 'all' ? true :
        activeTab === 'active' ? r.is_active :
        activeTab === 'paused' ? !r.is_active :
        (r.is_active && isOverdue(r.next_due_date))
      const text = `${r.description} ${r.accounts?.name || ''} ${r.categories?.name || ''}`.toLowerCase()
      const queryMatch = text.includes(searchQuery.toLowerCase())
      return tabMatch && queryMatch
    })
  }, [rows, activeTab, searchQuery])

  if (loading) {
    return <PageLoadingSkeleton variant="list" />
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-2xl mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Recurring Transactions
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {active.length} Active Rules
            </h1>
            {overdueCount > 0 && (
              <p className="text-xs text-expense font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} aria-hidden="true" /> {overdueCount} rules overdue
              </p>
            )}
          </div>
          <Link
            href="/recurring/new"
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-bold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Create recurring transaction"
          >
            <Plus size={14} aria-hidden="true" /> Add Rule
          </Link>
        </div>

        {overdueCount > 0 && <CatchUpOverdueButton overdueCount={overdueCount} />}

        {active.length > 0 && monthlyOutflow > 0 && (
          <div className="rounded-2xl border border-border bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Est. monthly outflow</p>
              <p className="text-2xl font-black tabular-nums text-expense">
                −{wrapPrivacy(formatCurrency(monthlyOutflow, rows[0]?.currency ?? 'IDR'))}
              </p>
            </div>
            <div className="text-right shrink-0 bg-muted/20 border border-border/40 px-3.5 py-2 rounded-xl text-xs font-medium text-muted-foreground">
              Est. Yearly: <span className="text-foreground font-bold font-mono">{wrapPrivacy(formatCurrency(monthlyOutflow * 12, rows[0]?.currency ?? 'IDR'))}</span>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
            {error}
          </p>
        )}

        {upcomingBills.length > 0 && (
          <section className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" /> Upcoming 30-Day Bill Calendar
            </h3>
            <div className="grid grid-cols-1 divide-y divide-border/45">
              {upcomingBills.slice(0, 4).map(bill => (
                <div key={bill.id} className="flex justify-between items-center py-2.5 text-xs font-medium first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${bill.daysLeft <= 3 ? 'bg-red-500 animate-pulse' : bill.daysLeft <= 10 ? 'bg-amber-500' : 'bg-indigo-400'}`}
                      aria-hidden="true"
                    />
                    <span className="text-foreground font-semibold truncate">{bill.description}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-muted-foreground font-mono">{wrapPrivacy(formatCurrency(bill.amount, bill.currency))}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${bill.daysLeft <= 3 ? 'bg-red-500/10 text-red-500' : bill.daysLeft <= 10 ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                      {bill.daysLeft === 0 ? 'Today' : bill.daysLeft === 1 ? '1d left' : `${bill.daysLeft}d left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-10 shadow-sm">
            <Search size={15} className="text-muted-foreground shrink-0" aria-hidden="true" />
            <label htmlFor="recurring-search" className="sr-only">Search recurring rules</label>
            <input
              id="recurring-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vendor, category, or account..."
              className="bg-transparent text-xs w-full focus:outline-none placeholder-muted-foreground"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Recurring filters">
            {([
              { id: 'all', label: 'All Rules' },
              { id: 'active', label: 'Active Only' },
              { id: 'paused', label: 'Paused Only' },
              ...(overdueCount > 0 ? [{ id: 'overdue' as TabId, label: 'Overdue Only' }] : []),
            ] as { id: TabId; label: string }[]).map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition focus-visible:ring-2
                  ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-2xl px-6 py-14 text-center border border-border bg-card shadow-sm">
            <div className="text-4xl mb-4" aria-hidden="true">🔁</div>
            <p className="text-sm font-semibold text-foreground mb-1">No matching rules</p>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
              No recurring rules match your filters. Reset and try again, or create a new rule.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTab('all') }}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted-foreground/10 transition-colors focus-visible:ring-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
              {filteredRows.map((r, i) => {
                const isItemOverdue = r.is_active && isOverdue(r.next_due_date)
                const isIncome = r.type === 'income'
                const yearlyProj = getYearlyProjection(r.amount, r.frequency)

                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/10 transition-colors ${i < filteredRows.length - 1 ? 'border-b border-border' : ''} ${!r.is_active ? 'opacity-60' : ''}`}
                  >
                    <Link href={`/recurring/${r.id}`} className="flex items-center gap-3 flex-1 min-w-0 focus-visible:ring-2 rounded-lg">
                      <div
                        className="w-9 h-9 rounded-[9px] flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: r.categories?.color ? `${r.categories.color}22` : isIncome ? 'var(--income-muted)' : 'var(--expense-muted)',
                          color: r.categories?.color ?? (isIncome ? 'var(--income)' : 'var(--expense)'),
                        }}
                        aria-hidden="true"
                      >
                        {renderCategoryIcon(r.categories?.icon, r.description ?? 'U', 'w-4.5 h-4.5')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-tight">{r.description}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {r.accounts?.name ?? '—'} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency}
                          {r.auto_generate && ' · Auto'}
                        </p>
                        {yearlyProj > 0 && (
                          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                            Proj. yearly: <span className="font-medium text-foreground/90 tabular-nums">{wrapPrivacy(formatCurrency(yearlyProj, r.currency))}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${isIncome ? 'text-income' : 'text-expense'}`}>
                          {isIncome ? '+' : '−'}{wrapPrivacy(formatCurrency(r.amount, r.currency))}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isItemOverdue ? 'text-expense font-semibold' : 'text-muted-foreground'}`}>
                          {isItemOverdue ? 'Overdue' : `Due ${new Date(r.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </p>
                      </div>
                    </Link>

                    <RecurringActions id={r.id} isActive={r.is_active} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card px-4 py-4 space-y-1 shadow-sm">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <AlertCircle size={13} className="text-primary" aria-hidden="true" /> Auto-generate guide
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rules with auto-generate enabled post automatically once a day via a scheduled job.
            Rules without it require &quot;Record now&quot; on the rule, or &quot;Catch up&quot; above to post all overdue rules at once.
          </p>
        </div>

      </div>
    </div>
  )
}