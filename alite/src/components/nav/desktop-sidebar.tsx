// filepath: alite/src/components/nav/desktop-sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NAV_ITEMS } from '@/components/nav/nav-config'

const STORAGE_KEY = 'alite_sidebar_collapsed'
const EXPANDED_WIDTH = 224 // px, matches existing md:pl-56
const COLLAPSED_WIDTH = 72 // px

export default function DesktopSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === '1') setCollapsed(true)
    } catch {
      // localStorage unavailable (e.g. private mode) — default to expanded
    }
  }, [])

  useEffect(() => {
    function applyOffset() {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      const px = isDesktop ? (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH) : 0
      document.documentElement.style.setProperty('--sidebar-content-offset', `${px}px`)
    }
    applyOffset()
    window.addEventListener('resize', applyOffset)
    return () => window.removeEventListener('resize', applyOffset)
  }, [collapsed])

  function toggle() {
    setCollapsed(prev => {
      const next = !prev
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // ignore persistence failures
      }
      return next
    })
  }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-[width] duration-200 ease-out"
      style={{ width: mounted ? width : EXPANDED_WIDTH }}
      aria-label="Primary navigation"
    >
      <div className="px-4 py-6 border-b border-border flex items-center justify-between gap-2 overflow-hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 focus-visible:ring-2 rounded-lg min-w-0"
          aria-label="Alite home"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold" aria-hidden="true">A</span>
          </div>
          {!collapsed && <span className="font-semibold truncate">Alite</span>}
        </Link>
        {!collapsed && <ThemeToggle className="scale-90 shrink-0" />}
      </div>

      <nav className="flex flex-col gap-1 px-3 py-4 flex-1 overflow-y-auto" aria-label="Primary">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl focus-visible:ring-2 transition-colors
                ${collapsed ? 'justify-center' : ''}
                ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" className="shrink-0" />
              {!collapsed && <span className="truncate text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:ring-2"
        >
          {collapsed ? <ChevronRight size={18} aria-hidden="true" /> : <ChevronLeft size={18} aria-hidden="true" />}
          {!collapsed && <span className="text-xs font-semibold">Collapse</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="px-5 py-3 border-t border-border text-[11px] text-muted-foreground">
          Alite · Personal Finance
        </div>
      )}
    </aside>
  )
}

export const SIDEBAR_WIDTHS = { expanded: EXPANDED_WIDTH, collapsed: COLLAPSED_WIDTH }