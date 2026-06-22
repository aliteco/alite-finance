// filepath: alite/src/app/(app)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InteractiveDashboard from '@/components/interactive-dashboard'
import DashboardOnboarding from '@/components/dashboard-onboarding'
import DashboardInsights from '@/components/dashboard-insights'
import { getBudgetProgress } from '@/app/actions/budgets'

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

  const trailingDate = new Date()
  trailingDate.setFullYear(trailingDate.getFullYear() - 1)
  const trailingDateISO = trailingDate.toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const [
    profileRes,
    accountsRes,
    transactionsRes,
    budgetsRes,
    goalsRes,
    contributionsRes,
    budgetProgress,
    overdueRecurringRes,
  ] = await Promise.all([
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
      .order('date', { ascending: true }),

    getBudgetProgress(),

    supabase
      .from('recurring_transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_due_date', today),
  ])

  const profile = profileRes.data || { base_currency: 'IDR' }
  const accounts: Account[] = (accountsRes.data as unknown as Account[]) || []
  const transactions: Transaction[] = (transactionsRes.data as unknown as Transaction[]) || []
  const budgets: Budget[] = (budgetsRes.data as unknown as Budget[]) || []
  const goals: Goal[] = (goalsRes.data as unknown as Goal[]) || []
  const contributions: GoalContribution[] = (contributionsRes.data as unknown as GoalContribution[]) || []
  const overdueRecurringCount = overdueRecurringRes.count ?? 0

  return {
    profile,
    accounts,
    transactions,
    budgets,
    goals,
    contributions,
    budgetProgress,
    overdueRecurringCount,
    baseCurrency: profile.base_currency,
  }
}

// ─── Main Entrance ────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const {
    accounts,
    transactions,
    budgets,
    goals,
    contributions,
    budgetProgress,
    overdueRecurringCount,
    baseCurrency,
  } = await getDashboardPayload()

  if (accounts.length === 0 || transactions.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <DashboardOnboarding hasAccounts={accounts.length > 0} />
      </div>
    )
  }

  const overBudgets = budgetProgress
    .filter(b => b.is_over)
    .map(b => ({
      id: b.budget_id,
      name: b.name,
      spent: b.spent,
      amount: b.amount,
      currency: b.currency,
      is_over: b.is_over,
      percentage: b.percentage,
    }))

  const nearLimitBudgets = budgetProgress
    .filter(b => !b.is_over && b.percentage >= 80)
    .map(b => ({
      id: b.budget_id,
      name: b.name,
      spent: b.spent,
      amount: b.amount,
      currency: b.currency,
      is_over: b.is_over,
      percentage: b.percentage,
    }))

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 pt-6">
        <DashboardInsights
          accounts={accounts}
          overBudgets={overBudgets}
          nearLimitBudgets={nearLimitBudgets}
          overdueRecurringCount={overdueRecurringCount}
        />
      </div>
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