// filepath: alite/src/components/empty-state.tsx

import Link from 'next/link'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
      {icon && (
        <div className="text-4xl mb-4 flex items-center justify-center" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {(actionHref || secondaryHref) && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {actionLabel}
            </Link>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="text-xs text-primary font-medium hover:underline focus-visible:ring-2 rounded"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}