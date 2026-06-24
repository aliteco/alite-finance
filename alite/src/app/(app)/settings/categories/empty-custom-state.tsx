// filepath: alite/src/app/(app)/settings/categories/empty-custom-state.tsx
import Link from 'next/link'

export default function EmptyCustomCategoriesState() {
  return (
    <div className="hidden md:block p-8 border border-dashed border-border rounded-2xl text-center">
      <p className="text-xs text-muted-foreground font-medium mb-2">
        No custom categories yet. Use the form to map your own labels.
      </p>
      <Link href="#catName" className="text-xs font-semibold text-primary hover:underline">
        Jump to form
      </Link>
    </div>
  )
}