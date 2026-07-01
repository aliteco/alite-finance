// filepath: alite/src/app/(app)/goals/page.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CURRENCY_SYMBOLS } from '@/lib/services/currency-types'
import {
  Target,
  Sparkles,
  TrendingUp,
  Search,
} from 'lucide-react'
import PageLoadingSkeleton from '@/components/page-loading-skeleton'

interface Goal {
  id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  currency: string
  target_date: string | null
  icon: string
  color: string
  is_completed: boolean
}

function pct(current: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function daysUntil(dateStr: string | null): string | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  const now = new Date()
  const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Past due'
  if (days === 0) return 'Due today'
  if (days < 30) return `${days}d left`
  if (days < 365) return `${Math.round(days / 30)}mo left`
  return `${(days / 365).toFixed(1)}y left`
}

type TabId = 'all' | 'active' | 'completed'

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const [privacyEnabled, setPrivacyEnabled] = useState(false)
  const [simulateDeposit, setSimulateDeposit] = useState(0)

  useEffect(() => {
    let active = true

    async function fetchGoals() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: goalsData, error: err } = await supabase
          .from('goals')
          .select('id, name, description, target_amount, current_amount, currency, target_date, icon, color, is_completed')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('is_completed', { ascending: true })
          .order('target_date', { ascending: true, nullsFirst: false })

        if (err) throw err
        if (active) setGoals((goalsData as Goal[]) ?? [])
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load goals')
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchGoals()

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
      maximumFractionDigits: 0,
    })}`
  }

  const active = useMemo(() => goals.filter(g => !g.is_completed), [goals])
  const completed = useMemo(() => goals.filter(g => g.is_completed), [goals])

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { target: number; current: number }> = {}
    goals.forEach(g => {
      if (!totals[g.currency]) totals[g.currency] = { target: 0, current: 0 }
      totals[g.currency].target += g.target_amount
      totals[g.currency].current += g.current_amount
    })
    return totals
  }, [goals])

  const simulatedGoals = useMemo(() => {
    if (simulateDeposit <= 0 || active.length === 0) return goals
    const slice = simulateDeposit / active.length
    return goals.map(g => {
      if (g.is_completed) return g
      const simulatedCurrent = Math.min(g.target_amount, g.current_amount + slice)
      return { ...g, current_amount: simulatedCurrent, is_completed: simulatedCurrent >= g.target_amount }
    })
  }, [goals, simulateDeposit, active])

  const simulatedTotalsByCurrency = useMemo(() => {
    const totals: Record<string, { target: number; current: number }> = {}
    simulatedGoals.forEach(g => {
      if (!totals[g.currency]) totals[g.currency] = { target: 0, current: 0 }
      totals[g.currency].target += g.target_amount
      totals[g.currency].current += g.current_amount
    })
    return totals
  }, [simulatedGoals])

  const filteredGoals = useMemo(() => {
    return simulatedGoals.filter(g => {
      const queryMatch =
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const tabMatch =
        activeTab === 'all' ? true :
        activeTab === 'active' ? !g.is_completed :
        g.is_completed
      return queryMatch && tabMatch
    })
  }, [simulatedGoals, searchQuery, activeTab])

  if (loading) {
    return <PageLoadingSkeleton variant="grid" />
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">

        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
              Goals
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {active.length} Active Targets
            </h1>
          </div>
          <Link
            href="/goals/new"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2"
            aria-label="Create goal"
          >
            <span>+ New Goal</span>
          </Link>
        </div>

        {error && (
          <p role="alert" className="text-xs text-expense bg-expense/10 rounded-xl px-4 py-3 border border-expense/20">
            {error}
          </p>
        )}

        {goals.length === 0 ? (
          <div className="rounded-2xl px-6 py-14 text-center border border-border bg-card">
            <div className="text-4xl mb-4" aria-hidden="true">🎯</div>
            <p className="text-sm font-semibold text-foreground mb-1">No goals configured</p>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
              Configure a custom target — an emergency cushion, a flight, or seed capital — and track progress.
            </p>
            <Link
              href="/goals/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2"
            >
              + Create Goal
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">

            <div className="md:col-span-5 md:sticky md:top-6 space-y-6">

              <div className="relative rounded-2xl px-6 py-6 border border-border bg-card overflow-hidden shadow-sm">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse 65% 55% at 80% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
                  aria-hidden="true"
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-4 flex items-center gap-1.5">
                  <Target size={14} aria-hidden="true" /> Milestone Diagnostics
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/10 p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Success Rate</p>
                    <p className="text-2xl font-black tabular-nums text-foreground mt-0.5">
                      {goals.length > 0 ? Math.round((completed.length / goals.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-muted/10 p-3 rounded-xl border border-border/40">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Settled Targets</p>
                    <p className="text-2xl font-black text-income mt-0.5">{completed.length} settled</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/50">
                  <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Aggregate Standings</p>
                  {Object.entries(simulatedTotalsByCurrency).map(([curr, val]) => {
                    const ratio = pct(val.current, val.target)
                    return (
                      <div key={curr} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-foreground tabular-nums">{curr}</span>
                          <span className="text-muted-foreground tabular-nums font-mono text-[11px]">
                            {wrapPrivacy(formatCurrency(val.current, curr))} / {wrapPrivacy(formatCurrency(val.target, curr))}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden bg-muted"
                          role="progressbar"
                          aria-valuenow={ratio}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${curr} goal progress`}
                        >
                          <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {active.length > 0 && (
                <section className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Sparkles size={13} className="text-primary" aria-hidden="true" /> Top-Up Windfall Simulator
                      </h4>
                      <p className="text-[11px] text-muted-foreground">See how a cash bonus affects your active goals</p>
                    </div>
                    {simulateDeposit > 0 && (
                      <button
                        onClick={() => setSimulateDeposit(0)}
                        className="text-[10px] hover:underline font-bold text-muted-foreground hover:text-foreground focus-visible:ring-2 rounded"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <label htmlFor="windfall-slider" className="sr-only">Simulated windfall amount</label>
                  <input
                    id="windfall-slider"
                    type="range"
                    min="0"
                    max="10000"
                    step="500"
                    value={simulateDeposit}
                    onChange={(e) => setSimulateDeposit(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-500 cursor-pointer h-1"
                  />

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">Windfall amount:</span>
                    <span className="text-sm font-black font-mono text-indigo-500">
                      +{formatCurrency(simulateDeposit, goals[0]?.currency ?? 'USD')}
                    </span>
                  </div>

                  {simulateDeposit > 0 && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-indigo-400 pl-2">
                      Simulates injecting <strong className="text-foreground">{formatCurrency(simulateDeposit / active.length, goals[0]?.currency ?? 'USD')}</strong> into each of your {active.length} active goals.
                    </p>
                  )}
                </section>
              )}

              <div className="hidden md:block rounded-2xl bg-muted/20 border border-border/30 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1">Target Speed Metrics</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Required savings are computed from calendar days remaining. Use top-ups to adjust pace.
                </p>
              </div>

            </div>

            <div className="md:col-span-7 space-y-6">

              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 h-10 shadow-sm">
                  <Search size={15} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <label htmlFor="goal-search" className="sr-only">Search goals</label>
                  <input
                    id="goal-search"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search goals by name or description..."
                    className="bg-transparent text-xs w-full focus:outline-none placeholder-muted-foreground"
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Goal filters">
                  {([
                    { id: 'all', label: 'All Targets' },
                    { id: 'active', label: `Active (${active.length})` },
                    { id: 'completed', label: `Completed (${completed.length})` },
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

              {filteredGoals.length === 0 ? (
                <div className="rounded-2xl px-6 py-14 text-center border border-border bg-card shadow-sm">
                  <div className="text-3xl mb-3" aria-hidden="true">🎯</div>
                  <p className="text-sm font-semibold text-foreground mb-1">No matching targets found</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Try a different search term or filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredGoals.map(g => (
                    <GoalCardItem key={g.id} goal={g} wrapPrivacy={wrapPrivacy} formatCurrency={formatCurrency} />
                  ))}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

function getSuggestedSaving(current: number, target: number, targetDateStr: string | null) {
  if (!targetDateStr || current >= target) return null
  const targetDate = new Date(targetDateStr)
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()
  const daysLeft = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  const remainingAmount = target - current
  const monthsLeft = daysLeft / 30.43

  if (monthsLeft >= 1) return { value: remainingAmount / monthsLeft, unit: 'mo' }
  const weeksLeft = daysLeft / 7
  if (weeksLeft >= 1) return { value: remainingAmount / weeksLeft, unit: 'wk' }
  return { value: remainingAmount / daysLeft, unit: 'day' }
}

interface GoalCardItemProps {
  goal: Goal
  wrapPrivacy: (val: string) => string
  formatCurrency: (amount: number, currency: string) => string
}

function GoalCardItem({ goal, wrapPrivacy, formatCurrency }: GoalCardItemProps) {
  const percentage = pct(goal.current_amount, goal.target_amount)
  const remaining = daysUntil(goal.target_date)
  const suggestedSaving = getSuggestedSaving(goal.current_amount, goal.target_amount, goal.target_date)

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="block rounded-2xl border border-border bg-card px-4 py-4 hover:shadow-md hover:border-indigo-500/20 transition-all duration-300 focus-visible:ring-2"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${goal.color}22`, color: goal.color }}
          aria-hidden="true"
        >
          {goal.is_completed ? '✓' : (goal.icon || '🎯')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{goal.name}</p>
          {goal.description && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">{goal.description}</p>
          )}
        </div>
        {remaining && !goal.is_completed && (
          <span className="text-[10px] font-bold text-muted-foreground shrink-0 bg-muted/65 rounded-lg px-2 py-0.5 border border-border/30 font-mono">
            {remaining}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-xs font-extrabold tabular-nums text-foreground">
          {wrapPrivacy(formatCurrency(goal.current_amount, goal.currency))}
          <span className="font-normal text-muted-foreground"> / {wrapPrivacy(formatCurrency(goal.target_amount, goal.currency))}</span>
        </p>
        <p className="text-xs font-bold tabular-nums text-muted-foreground">{percentage}%</p>
      </div>

      <div
        className="h-2 rounded-full overflow-hidden bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${goal.name} progress`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, background: goal.is_completed ? '#10b981' : goal.color }}
        />
      </div>

      {suggestedSaving && !goal.is_completed && (
        <div className="mt-3.5 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <TrendingUp size={11} className="text-indigo-400" aria-hidden="true" />
            <span>Required top-up rate:</span>
          </span>
          <span className="font-bold text-foreground bg-muted/45 px-2 py-0.5 rounded-lg border border-border/30 font-mono">
            {wrapPrivacy(formatCurrency(suggestedSaving.value, goal.currency))} / {suggestedSaving.unit}
          </span>
        </div>
      )}
    </Link>
  )
}