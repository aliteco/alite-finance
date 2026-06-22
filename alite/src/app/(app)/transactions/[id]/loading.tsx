// filepath: alite/src/app/(app)/transactions/[id]/loading.tsx
export default function TransactionDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-28" aria-busy="true" aria-live="polite">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-7 w-12 rounded-lg" />
        </div>
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-11 rounded-2xl" />
      </div>
    </div>
  )
}