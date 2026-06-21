import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BudgetForm from '@/components/budget-form'

export default async function NewBudgetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileRes, categoriesRes, existingBudgetsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('base_currency')
      .eq('id', user.id)
      .single(),

    supabase
      .from('categories')
      .select('id, name, type')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('name'),

    supabase
      .from('budgets')
      .select('category_id, period')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  const baseCurrency = profileRes.data?.base_currency ?? 'IDR'
  const categories = categoriesRes.data ?? []
  const existingBudgets = existingBudgetsRes.data ?? []

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-center gap-3">
          <Link
            href="/budgets"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to budgets"
          >
            ←
          </Link>
          <div>
            <h1 className="text-xl font-bold">Create Budget</h1>
            <p className="text-xs text-muted-foreground">
              Set a spending limit for a category
            </p>
          </div>
        </div>

        <BudgetForm categories={categories} baseCurrency={baseCurrency} existingBudgets={existingBudgets} />
      </div>
    </div>
  )
}