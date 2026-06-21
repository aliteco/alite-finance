// filepath: alite/src/app/actions/budgets.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export interface BudgetProgress {
  budget_id: string
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  category_id: string | null
  category_name: string | null
  category_color: string | null
  category_icon: string | null
  period_start: string
  period_end: string
  spent: number
  remaining: number
  percentage: number
  is_over: boolean
}

export async function getBudgetProgress(): Promise<BudgetProgress[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.rpc('get_budget_progress', { p_user_id: user.id })
  if (error) {
    console.error('getBudgetProgress failed:', error.message)
    return []
  }
  return (data as BudgetProgress[]) ?? []
}