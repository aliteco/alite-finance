// filepath: alite/src/app/(app)/layout.tsx

import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import Navigation from "@/components/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { CurrencyProvider } from "@/components/currency-provider"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // you should fetch this from profile if available
  const baseCurrency = "USD"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* Mobile header */}
      <header className="sticky top-0 inset-x-0 h-14 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 flex items-center justify-between z-30 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-xs">
              A
            </span>
          </div>
          <span className="text-sm font-bold tracking-tight">Alite</span>
        </Link>

        <ThemeToggle className="scale-90" />
      </header>

      <Navigation />

      {/* ✅ ADD PROVIDER HERE */}
      <CurrencyProvider initialBaseCurrency={baseCurrency}>
        <main
          id="main-content"
          className="pb-28 md:pb-0 min-h-screen transition-[padding] duration-200 ease-out"
          style={{ paddingLeft: 'var(--sidebar-content-offset, 0px)' }}
        >
          {children}
        </main>
      </CurrencyProvider>
    </div>
  )
}