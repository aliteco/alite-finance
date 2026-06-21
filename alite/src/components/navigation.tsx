'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './theme-toggle'

import {
  Home,
  CreditCard,
  BarChart3,
  PiggyBank,
  Target,
  Repeat,
  Settings,
  Ellipsis,
} from 'lucide-react'

// ─────────────────────────────
// NAV CONFIG
// ─────────────────────────────
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/transactions', label: 'Transactions', icon: BarChart3 },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/recurring', label: 'Recurring', icon: Repeat },
  { href: '/settings', label: 'Settings', icon: Settings },
]

// ─────────────────────────────
// COMPONENT
// ─────────────────────────────
export default function Navigation() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href)

  const mobileCoreItems = [
    NAV_ITEMS[0],
    NAV_ITEMS[2],
    NAV_ITEMS[3],
  ]

  const mobileMoreItems = [
    NAV_ITEMS[1],
    NAV_ITEMS[4],
    NAV_ITEMS[5],
    NAV_ITEMS[6],
  ]

  const anyMoreActive = mobileMoreItems.some(i => isActive(i.href))

  return (
    <>
      {/* ── Mobile overlay ── */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="fixed bottom-20 inset-x-4 bg-card border border-border rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-xs font-bold">More</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-muted"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {mobileMoreItems.map(item => {
                const active = isActive(item.href)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border
                      ${
                        active
                          ? 'bg-primary/5 border-primary text-primary'
                          : 'bg-muted/20 border-border text-muted-foreground'
                      }`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    <span className="text-[11px] mt-2">
                      {item.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile nav ── */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-card/85 backdrop-blur border border-border rounded-2xl shadow-xl">
        <div className="flex items-center justify-around h-14 px-2">
          {mobileCoreItems.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center flex-1 py-1.5
                  ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span className="text-[9.5px] mt-0.5 font-semibold">
                  {item.label === 'Transactions'
                    ? 'Ledger'
                    : item.label}
                </span>
              </Link>
            )
          })}

          {/* More */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center flex-1 py-1.5
              ${isMoreOpen || anyMoreActive
                ? 'text-primary'
                : 'text-muted-foreground'}`}
          >
            <Ellipsis
              size={22}
              strokeWidth={isMoreOpen ? 2.2 : 1.8}
            />
            <span className="text-[9.5px] mt-0.5 font-semibold">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-56 bg-card border-r border-border z-40">
        <div className="px-5 py-6 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">
                A
              </span>
            </div>
            <span className="font-semibold">Alite</span>
          </Link>

          <ThemeToggle className="scale-90" />
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border text-xs text-muted-foreground">
          ALITE · Personal Finance
        </div>
      </aside>
    </>
  )
}