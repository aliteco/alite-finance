// filepath: alite/src/app/(app)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InteractiveDashboard from '@/components/interactive-dashboard'
import DashboardOnboarding from '@/components/dashboard-onboarding'
import { ICONS } from '@/lib/icons'

// ─── Server Side Types ────────────────────────────────────────────────────────

interface Profile {
  base_currency: string
}

interface Account {
  id: string
  name: string
  currency: string
  balance: number
  type: string
  color?: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  base_currency_amount: number
  currency: string
  description: string | null
  date: string
  created_at: string
  transfer_id: string | null
  transfer_type: 'debit' | 'credit' | null
  categories: { id: string; name: string; color: string | null; icon: string | null } | null
  accounts: { id: string; name: string; currency: string; type: string } | null
}

interface Budget {
  id: string
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  is_active: boolean
  category_id: string | null
  categories: { id: string; name: string; color: string | null; icon: string | null } | null
}

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
  is_active: boolean
  created_at: string
}

interface GoalContribution {
  id: string
  goal_id: string
  amount: number
  currency: string
  exchange_rate: number
  base_currency_amount: number
  date: string
  created_at: string
}

// ─── Data fetch coordinator ───────────────────────────────────────────────────

async function getDashboardPayload() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Trailing 12 months for historical cashflow analysis.
  // IMPORTANT: filter on `date` (the user-assigned transaction date), not
  // `created_at` (the row insert timestamp) — these can diverge whenever
  // someone backdates a transaction, which previously caused the dashboard's
  // monthly totals to silently disagree with the trend charts.
  const trailingDate = new Date()
  trailingDate.setFullYear(trailingDate.getFullYear() - 1)
  const trailingDateISO = trailingDate.toISOString().slice(0, 10)

  const [profileRes, accountsRes, transactionsRes, budgetsRes, goalsRes, contributionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single<Profile>(),

    supabase
      .from('accounts')
      .select('id, name, currency, balance, type, color')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('balance', { ascending: false }),

    supabase
      .from('transactions')
      .select(`
        id, type, amount, base_currency_amount, currency,
        description, date, created_at, transfer_id, transfer_type,
        categories ( id, name, color, icon ),
        accounts ( id, name, currency, type )
      `)
      .eq('user_id', user.id)
      .gte('date', trailingDateISO)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('budgets')
      .select(`
        id, name, amount, currency, period, start_date, end_date, is_active, category_id,
        categories ( id, name, color, icon )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true),

    supabase
      .from('goals')
      .select('id, name, description, target_amount, current_amount, currency, target_date, icon, color, is_completed, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true),

    supabase
      .from('goal_contributions')
      .select('id, goal_id, amount, currency, exchange_rate, base_currency_amount, date, created_at')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
  ])

  const profile = profileRes.data || { base_currency: 'IDR' }
  const accounts: Account[] = (accountsRes.data as unknown as Account[]) || []
  const transactions: Transaction[] = (transactionsRes.data as unknown as Transaction[]) || []
  const budgets: Budget[] = (budgetsRes.data as unknown as Budget[]) || []
  const goals: Goal[] = (goalsRes.data as unknown as Goal[]) || []
  const contributions: GoalContribution[] = (contributionsRes.data as unknown as GoalContribution[]) || []

  return {
    profile,
    accounts,
    transactions,
    budgets,
    goals,
    contributions,
    baseCurrency: profile.base_currency,
  }
}

// ─── Main Entrance ────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const { accounts, transactions, budgets, goals, contributions, baseCurrency } = await getDashboardPayload()

  // First-run experience: no charts/KPIs on empty data — show actionable
  // onboarding instead of a dashboard full of zeros and broken pie charts.
  if (accounts.length === 0 || transactions.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <DashboardOnboarding hasAccounts={accounts.length > 0} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <InteractiveDashboard
        initialAccounts={accounts}
        initialTransactions={transactions}
        initialBudgets={budgets}
        initialGoals={goals}
        initialContributions={contributions}
        baseCurrency={baseCurrency}
      />
    </div>
  )
}