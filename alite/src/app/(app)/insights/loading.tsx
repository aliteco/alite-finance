// filepath: alite/src/app/(app)/insights/loading.tsx

export default function InsightsLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">
        <div className="space-y-2 border-b border-border/40 pb-4">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="skeleton h-9 w-48 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
        <div className="skeleton h-24 rounded-2xl" />
      </div>
    </div>
  )
}