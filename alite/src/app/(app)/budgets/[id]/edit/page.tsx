// filepath: alite/src/app/(app)/budgets/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EditBudgetForm from '@/components/edit-budget-form'

export default async function EditBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [budgetRes, categoriesRes] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, name, amount, period, category_id, end_date')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('categories')
      .select('id, name, type')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('name'),
  ])

  if (budgetRes.error || !budgetRes.data) notFound()

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/budgets" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to budgets">
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Edit budget</h1>
        </div>

        <EditBudgetForm
          budgetId={budgetRes.data.id}
          initialName={budgetRes.data.name}
          initialAmount={budgetRes.data.amount}
          initialPeriod={budgetRes.data.period}
          initialCategoryId={budgetRes.data.category_id}
          initialEndDate={budgetRes.data.end_date}
          categories={categoriesRes.data ?? []}
        />
      </div>
    </div>
  )
}