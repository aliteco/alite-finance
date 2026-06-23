// filepath: alite/src/app/(app)/accounts/new/loading.tsx

export default function NewAccountLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
          <div className="w-14" />
        </div>
        <div className="skeleton h-72 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
      </div>
    </div>
  )
}