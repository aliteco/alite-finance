// filepath: alite/src/app/(app)/dashboard/loading.tsx

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background pb-12" aria-busy="true" aria-live="polite">
      <div className="w-full max-w-7xl mx-auto px-4 pt-6">
        <div className="skeleton h-14 rounded-2xl" />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="skeleton h-9 w-full max-w-md rounded-xl" />
        <div className="skeleton h-40 rounded-3xl" />
        <div className="flex items-center justify-between gap-3">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="skeleton h-9 w-64 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-80 rounded-2xl" />
          </div>
          <div className="md:col-span-4 space-y-6">
            <div className="skeleton h-44 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-56 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}