// filepath: alite/src/components/nav/mobile-nav.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ellipsis } from 'lucide-react'
import { NAV_ITEMS, MOBILE_CORE_COUNT } from '@/components/nav/nav-config'

export default function MobileNav() {
  const pathname = usePathname()
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const coreItems = NAV_ITEMS.slice(0, MOBILE_CORE_COUNT)
  const moreItems = NAV_ITEMS.slice(MOBILE_CORE_COUNT)
  const anyMoreActive = moreItems.some(i => isActive(i.href))

  useEffect(() => {
    if (!isMoreOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMoreOpen(false)
        moreTriggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isMoreOpen])

  return (
    <>
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="More navigation options"
            className="fixed bottom-20 inset-x-4 bg-card border border-border rounded-2xl p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="text-xs font-bold">More</h3>
              <button
                ref={closeButtonRef}
                onClick={() => {
                  setIsMoreOpen(false)
                  moreTriggerRef.current?.focus()
                }}
                className="text-xs font-bold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg bg-muted focus-visible:ring-2"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {moreItems.map(item => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border focus-visible:ring-2
                      ${active ? 'bg-primary/5 border-primary text-primary' : 'bg-muted/20 border-border text-muted-foreground'}`}
                  >
                    <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                    <span className="text-[11px] mt-2 text-center">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-4 left-4 right-4 z-40 md:hidden bg-card/85 backdrop-blur border border-border rounded-2xl shadow-xl"
        aria-label="Primary"
      >
        <div className="flex items-center justify-around h-14 px-2">
          {coreItems.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center flex-1 py-1.5 focus-visible:ring-2 rounded-lg
                  ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                <span className="text-[9.5px] mt-0.5 font-semibold">{item.mobileLabel ?? item.label}</span>
              </Link>
            )
          })}

          <button
            ref={moreTriggerRef}
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label="More navigation options"
            className={`flex flex-col items-center flex-1 py-1.5 focus-visible:ring-2 rounded-lg
              ${isMoreOpen || anyMoreActive ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Ellipsis size={22} strokeWidth={isMoreOpen ? 2.2 : 1.8} aria-hidden="true" />
            <span className="text-[9.5px] mt-0.5 font-semibold">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}