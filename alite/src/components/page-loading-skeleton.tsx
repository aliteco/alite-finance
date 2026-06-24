// filepath: alite/src/components/page-loading-skeleton.tsx
import { Skeleton } from '@/components/skeleton'

export default function PageLoadingSkeleton({
  variant = 'list',
}: {
  variant?: 'list' | 'grid'
}) {
  return (
    <div
      className="min-h-screen bg-background pb-28"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="max-w-md md:max-w-5xl lg:max-w-6xl mx-auto px-4 pt-8 space-y-6 md:space-y-8">
        <div className="flex items-end justify-between border-b border-border/40 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-9 w-40 rounded" />
          </div>
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        {variant === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
            <div className="md:col-span-5 space-y-6">
              <Skeleton className="h-64 rounded-2xl" />
            </div>
            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        )}
      </div>
    </div>
  )
}