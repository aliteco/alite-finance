// filepath: alite/src/app/(app)/budgets/[id]/edit/loading.tsx
export default function EditBudgetLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-6 w-32 rounded" />
        </div>
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-11 rounded-2xl" />
      </div>
    </div>
  )
}