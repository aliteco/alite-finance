// filepath: alite/src/app/(app)/budgets/loading.tsx
export default function BudgetsLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div className="space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-9 w-24 rounded" />
          </div>
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="md:col-span-5 space-y-6">
            <div className="skeleton h-56 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
          <div className="md:col-span-7 space-y-6">
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
            <div className="skeleton h-20 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}