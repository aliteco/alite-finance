import type { ReactNode } from 'react'

const DEFAULT_POINTS = [
  'Track every account in its own currency',
  'Transfers never inflate income or expenses',
  'Net worth calculated live, never estimated',
]

interface AuthLayoutProps {
  children: ReactNode
  panelTitle?: string
  panelBody?: string
  panelPoints?: string[]
}

export function AuthLayout({
  children,
  panelTitle = 'The first number you can actually trust.',
  panelBody = 'Alite tells the difference between money you earned and money you just moved — so every total it shows you is real.',
  panelPoints = DEFAULT_POINTS,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
      {/* ── Brand panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[42%] border-r border-border bg-card flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm leading-none">A</span>
          </div>
          <span className="text-sm font-semibold tracking-tight">Alite</span>
        </div>

        <div className="max-w-sm">
          <h2 className="text-3xl font-bold tracking-[-0.04em] leading-[1.15] mb-4">
            {panelTitle}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {panelBody}
          </p>
          <ul className="space-y-2.5">
            {panelPoints.map((point) => (
              <li key={point} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-income mt-0.5 shrink-0">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Alite · Personal Finance
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm leading-none">A</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Alite</span>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
