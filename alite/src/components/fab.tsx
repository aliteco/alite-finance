'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Shuffle } from 'lucide-react'

export default function FloatingActionButton() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Only render on relevant authenticated pages
  const allowedPages = ['/dashboard', '/accounts', '/budgets']
  const isAllowed = allowedPages.some(
    (page) => pathname === page || pathname?.startsWith(`${page}/`)
  )

  // Prevent showing on 'new' forms or settings to avoid layout double-up
  const isFormOrSettings = pathname?.includes('/new') || pathname?.includes('/settings')

  if (!isAllowed || isFormOrSettings) {
    return null
  }

  const actions = [
    {
      href: '/transactions?type=expense',
      label: 'Record Expense',
      icon: <TrendingDown size={16} className="text-expense" />,
      bg: 'hover:bg-expense/10 border-expense/25',
    },
    {
      href: '/transactions?type=income',
      label: 'Log Income',
      icon: <TrendingUp size={16} className="text-income" />,
      bg: 'hover:bg-income/10 border-income/25',
    },
    {
      href: '/transactions?type=transfer',
      label: 'Transfer Funds',
      icon: <Shuffle size={16} className="text-primary" />,
      bg: 'hover:bg-primary/10 border-primary/25',
    },
  ]

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50 flex flex-col items-end gap-3" id="fab-container">
      {/* Expanded Quick Links */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom duration-200">
          {actions.map((act) => (
            <Link
              key={act.href}
              href={act.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 bg-card border px-3.5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-[1.02] text-xs font-semibold text-foreground ${act.bg}`}
              id={`fab-action-${act.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="shrink-0">{act.icon}</span>
              <span>{act.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Main FAB Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 md:w-14 md:h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none"
        aria-label="Add Transaction Options"
        id="fab-main-button"
      >
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <Plus size={24} strokeWidth={2.4} />
        </div>
      </button>
    </div>
  )
}
