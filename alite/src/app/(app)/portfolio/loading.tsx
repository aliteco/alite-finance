// filepath: alite/src/app/(app)/portfolio/loading.tsx

export default function PortfolioLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8" aria-busy="true" aria-live="polite">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="skeleton h-7 w-64 rounded" />
          <div className="skeleton h-3 w-80 rounded" />
        </div>
        <div className="skeleton h-7 w-44 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="skeleton h-44 rounded-2xl" />
        <div className="skeleton h-44 rounded-2xl" />
        <div className="skeleton h-44 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 skeleton h-96 rounded-2xl" />
        <div className="lg:col-span-8 skeleton h-96 rounded-2xl" />
      </div>
    </div>
  )
}