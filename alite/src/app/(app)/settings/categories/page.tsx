import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CategoryForm from '@/components/category-form'
import DeleteCategoryButton from '@/components/delete-category-button'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
  is_system: boolean
}

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('categories')
    .select('id, name, icon, color, type, is_system')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('is_system', { ascending: false })
    .order('name')

  const categories: Category[] = data ?? []
  const system = categories.filter(c => c.is_system)
  const custom = categories.filter(c => !c.is_system)

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to settings">
              ←
            </Link>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-1">
                Categories
              </p>
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
                {categories.length} total
              </h1>
            </div>
          </div>
        </div>

        <CategoryForm />

        {custom.length > 0 && (
          <section aria-labelledby="custom-categories">
            <p id="custom-categories" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
              Your categories
            </p>
            <div className="rounded-2xl overflow-hidden border border-border bg-card">
              {custom.map((cat, i) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < custom.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center text-sm shrink-0"
                    style={{ background: `${cat.color}22`, color: cat.color }}
                    aria-hidden="true"
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{cat.type}</p>
                  </div>
                  <DeleteCategoryButton categoryId={cat.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="system-categories">
          <p id="system-categories" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] mb-2.5 px-0.5">
            Built-in categories
          </p>
          <div className="rounded-2xl overflow-hidden border border-border bg-card">
            {system.map((cat, i) => (
              <div
                key={cat.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < system.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-[9px] flex items-center justify-center text-sm shrink-0"
                  style={{ background: `${cat.color}22`, color: cat.color }}
                  aria-hidden="true"
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{cat.type}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}