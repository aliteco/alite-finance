// filepath: alite/src/app/(app)/recurring/loading.tsx
export default function RecurringLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-9 w-28 rounded" />
          </div>
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}