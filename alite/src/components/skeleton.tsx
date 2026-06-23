// filepath: alite/src/components/skeleton.tsx

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-4 space-y-3 ${className}`}>
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-7 w-32 rounded" />
    </div>
  )
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-2.5 w-20 rounded" />
      </div>
      <Skeleton className="h-3 w-14 rounded shrink-0" />
    </div>
  )
}