'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/accounts',
    label: 'Accounts',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2.5" />
        <path d="M2 10h20" />
        <path d="M6 15h3" />
        <path d="M15 15h3" />
      </svg>
    ),
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l4-4 4 4" />
        <path d="M7 5v14" />
        <path d="M21 15l-4 4-4-4" />
        <path d="M17 19V5" />
      </svg>
    ),
  },
  {
    href: '/budgets',
    label: 'Budgets',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    href: '/goals',
    label: 'Goals',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    href: '/recurring',
    label: 'Recurring',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 2.1l4 4-4 4" />
        <path d="M3 12.7V12a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3" />
        <path d="M7 21.9l-4-4 4-4" />
        <path d="M21 11.3V12a9 9 0 0 1-9 9 9 0 0 1-6-2.3" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  // Core items for mobile bottom row (Exactly 3, spacious + 1 More item = 4 items count)
  const mobileCoreItems = [
    NAV_ITEMS[0], // Home (/dashboard)
    NAV_ITEMS[2], // Transactions (/transactions)
    NAV_ITEMS[3], // Budgets (/budgets)
  ]

  // More items inside overlay sheet (Now including Wallets / Accounts)
  const mobileMoreItems = [
    NAV_ITEMS[1], // Accounts (/accounts)
    NAV_ITEMS[4], // Goals (/goals)
    NAV_ITEMS[5], // Recurring (/recurring)
    NAV_ITEMS[6], // Settings (/settings)
  ]

  const anyMoreActive = mobileMoreItems.some(item => isActive(item.href))

  return (
    <>
      {/* ── Mobile menu overlay drawer bottom sheet ── */}
      {isMoreOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          <div 
            className="fixed bottom-22 inset-x-4 bg-card border border-border/70 rounded-2xl p-5 space-y-4 shadow-2xl animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-xs font-bold text-foreground">More Categories</h3>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg bg-muted"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {mobileMoreItems.map(({ href, label, icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all duration-200
                      ${active 
                        ? 'bg-primary/5 border-primary text-primary font-bold shadow-2xs' 
                        : 'bg-muted/15 border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }`}
                  >
                    <div className="mb-2 shrink-0">{icon(active)}</div>
                    <span className="text-[11px] font-semibold text-center leading-tight truncate w-full">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav floating pill capsule ── */}
      <nav
        className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl transition-all duration-300"
        aria-label="Primary"
      >
        <div className="flex items-center justify-around h-14 px-2">
          {mobileCoreItems.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors min-w-[56px] py-1.5
                  ${active
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground active:text-foreground'
                  }`}
              >
                {icon(active)}
                <span className={`text-[9.5px] font-semibold leading-none mt-0.5 ${active ? 'text-primary' : ''}`}>
                  {label === 'Transactions' ? 'Ledger' : label}
                </span>
              </Link>
            )
          })}

          {/* More Trigger Button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-label="More options"
            aria-expanded={isMoreOpen}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors min-w-[56px] py-1.5 focus:outline-none
              ${isMoreOpen || anyMoreActive
                ? 'text-primary font-medium'
                : 'text-muted-foreground active:text-foreground'
              }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={(isMoreOpen || anyMoreActive) ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
            <span className="text-[9.5px] font-semibold leading-none mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-56 bg-card border-r border-border z-40">
        {/* Wordmark */}
        <div className="px-5 py-6 border-b border-border flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground truncate">Alite</span>
          </Link>
          <ThemeToggle className="shrink-0 scale-90" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1" aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                {icon(active)}
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer hint */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">ALITE · Personal Finance</p>
        </div>
      </aside>
    </>
  )
}