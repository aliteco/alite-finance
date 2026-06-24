import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CategoryForm from '@/components/category-form'
import DeleteCategoryButton from '@/components/delete-category-button'
import { renderCategoryIcon } from '@/lib/icons'
import { ChevronLeft } from 'lucide-react'

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
    <div className="min-h-screen bg-background text-foreground antialiased pb-28">
      {/* Expanded standard layout max-width constraints */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: CONTROL PANEL (Sticky on Desktop) */}
          <div className="md:col-span-5 md:sticky md:top-8 space-y-6">
            {/* Dynamic Structural Header Block */}
            <div className="flex items-center gap-3.5 pb-2">
              <Link
                href="/settings"
                className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-95"
                aria-label="Back to configuration dashboard"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </Link>

              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  System Settings
                </p>
                <h1 className="text-xl font-bold tracking-tight text-foreground leading-none">
                  Transaction Categories
                </h1>
              </div>
            </div>

            {/* Global Component Inserter Form */}
            <CategoryForm />
          </div>

          {/* RIGHT SIDE: LIST VIEWS (Scrollable Stack) */}
          <div className="md:col-span-7 space-y-7">
            
            {/* Custom User Category Registry */}
            {custom.length > 0 ? (
              <section aria-labelledby="custom-categories" className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p id="custom-categories" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Your Custom Labels
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded">
                    {custom.length} items
                  </span>
                </div>

                <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50 shadow-sm">
                  {custom.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-border/30"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                        }}
                        aria-hidden="true"
                      >
                        {renderCategoryIcon(cat.icon, cat.name, 'w-4 h-4')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium capitalize tracking-wide">
                          {cat.type} matrix
                        </p>
                      </div>

                      <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                        <DeleteCategoryButton categoryId={cat.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              /* Visual placeholder only when user has zero categories created yet */
              <div className="hidden md:block p-8 border border-dashed border-border rounded-2xl text-center">
                <p className="text-xs text-muted-foreground font-medium">
                  No custom items compiled yet. Use the form tool to map your own targets.
                </p>
              </div>
            )}

            {/* Immutable Core Global Registry */}
            <section aria-labelledby="system-categories" className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p id="system-categories" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Built-in Global Modules
                </p>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 border border-border/40 px-1.5 py-0.5 rounded">
                  {system.length} items
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/50 shadow-sm">
                {system.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 px-4 py-3 bg-muted/5 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-border/20"
                      style={{
                        backgroundColor: `${cat.color}12`,
                        color: cat.color,
                      }}
                      aria-hidden="true"
                    >
                      {renderCategoryIcon(cat.icon, cat.name, 'w-4 h-4')}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground/80 truncate">
                        {cat.name}
                  </p>
                      <p className="text-[10px] text-muted-foreground/70 font-medium capitalize tracking-wide">
                        {cat.type} standard
                      </p>
                    </div>
                    
                    <span className="text-[9px] font-bold bg-muted border border-border/60 px-2 py-0.5 rounded-md text-muted-foreground uppercase tracking-wider select-none">
                      Core
                    </span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  )
}