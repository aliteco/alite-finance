import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function NewBudgetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Create Budget</h1>
          <p className="text-xs text-muted-foreground">
            Set a spending limit for a category
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4">

          {/* Name */}
          <div>
            <label className="text-xs text-muted-foreground">Budget name</label>
            <input
              name="name"
              placeholder="e.g. Food budget"
              className="w-full mt-1"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-muted-foreground">Amount</label>
            <input
              name="amount"
              type="number"
              placeholder="0"
              className="w-full mt-1"
              required
            />
          </div>

          {/* Period */}
          <div>
            <label className="text-xs text-muted-foreground">Period</label>
            <select name="period" className="w-full mt-1">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select name="category_id" className="w-full mt-1">
              <option value="">All categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ? `${c.icon} ` : ''}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Create Budget
          </button>
        </form>
      </div>
    </div>
  )
}