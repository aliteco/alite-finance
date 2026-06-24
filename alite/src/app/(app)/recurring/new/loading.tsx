// filepath: alite/src/app/(app)/recurring/new/loading.tsx
export default function NewRecurringLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-6 w-32 rounded" />
        </div>
        <div className="skeleton h-9 rounded-xl" />
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-36 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-12 rounded-2xl" />
      </div>
    </div>
  )
}