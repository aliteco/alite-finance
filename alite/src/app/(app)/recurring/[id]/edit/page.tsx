// filepath: alite/src/app/(app)/recurring/[id]/edit/page.tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/app/actions/transactions'
import EditRecurringForm from '@/components/edit-recurring-form'

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [ruleRes, categories] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('id, type, amount, currency, description, frequency, category_id, end_date, auto_generate')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    getCategories(),
  ])

  if (ruleRes.error || !ruleRes.data) notFound()
  const rule = ruleRes.data as {
    id: string
    type: 'income' | 'expense'
    amount: number
    currency: string
    description: string
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
    category_id: string | null
    end_date: string | null
    auto_generate: boolean
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/recurring/${id}`}
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 rounded-lg"
            aria-label="Back to rule"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Edit recurring</h1>
        </div>

        <EditRecurringForm
          recurringId={rule.id}
          initialAmount={rule.amount}
          initialDescription={rule.description}
          initialFrequency={rule.frequency}
          initialCategoryId={rule.category_id}
          initialEndDate={rule.end_date}
          initialAutoGenerate={rule.auto_generate}
          currency={rule.currency}
          categories={categories}
          transactionType={rule.type}
        />
      </div>
    </div>
  )
}