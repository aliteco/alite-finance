// filepath: alite/src/app/(app)/settings/loading.tsx
export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-6 w-24 rounded" />
            <div className="skeleton h-3 w-40 rounded" />
          </div>
        </div>
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-11 rounded-2xl" />
      </div>
    </div>
  )
}