// filepath: alite/src/app/(app)/settings/categories/loading.tsx
export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-6 w-20 rounded" />
          </div>
        </div>
        <div className="skeleton h-11 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  )
}