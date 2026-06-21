// filepath: alite/src/app/(app)/transactions/loading.tsx
export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div className="space-y-2">
            <div className="skeleton h-3 w-12 rounded" />
            <div className="skeleton h-9 w-40 rounded" />
          </div>
          <div className="skeleton h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="md:col-span-4 space-y-4">
            <div className="skeleton h-10 rounded-xl" />
            <div className="skeleton h-9 rounded-xl" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
          <div className="md:col-span-8 space-y-3">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
            <div className="skeleton h-16 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}