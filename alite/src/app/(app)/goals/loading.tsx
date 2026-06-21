// filepath: alite/src/app/(app)/goals/loading.tsx
export default function GoalsLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div className="space-y-2">
            <div className="skeleton h-3 w-14 rounded" />
            <div className="skeleton h-9 w-36 rounded" />
          </div>
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
          <div className="md:col-span-5">
            <div className="skeleton h-64 rounded-2xl" />
          </div>
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}