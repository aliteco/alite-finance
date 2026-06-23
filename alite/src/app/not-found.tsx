// filepath: alite/src/app/not-found.tsx

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold tracking-tight text-foreground mb-2" aria-hidden="true">404</p>
        <h1 className="text-lg font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}