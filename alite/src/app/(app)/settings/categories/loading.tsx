// filepath: alite/src/app/(app)/settings/categories/loading.tsx
export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 md:pt-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3.5 pb-2">
              <div className="skeleton h-8 w-8 rounded-xl" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-5 w-40 rounded" />
              </div>
            </div>
            <div className="skeleton h-11 rounded-xl" />
          </div>
          <div className="md:col-span-7 space-y-7">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}