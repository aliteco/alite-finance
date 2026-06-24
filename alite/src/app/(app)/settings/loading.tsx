// filepath: alite/src/app/(app)/settings/loading.tsx
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-live="polite">
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-10 pb-16 space-y-8">
        <div className="border-b border-border/60 pb-6 space-y-2">
          <div className="skeleton h-7 w-32 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
        <div className="space-y-2.5">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
          </div>
        </div>
        <div className="space-y-2.5">
          <div className="skeleton h-3 w-32 rounded" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-44 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}