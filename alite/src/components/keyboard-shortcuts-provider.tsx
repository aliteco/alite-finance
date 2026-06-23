// filepath: alite/src/components/keyboard-shortcuts-provider.tsx

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Lightweight global "quick add" shortcut (press "n" anywhere outside an
// input/textarea to jump to the new-transaction flow). Purely additive —
// does not interfere with any existing form behavior since it ignores
// keypresses while focus is inside form controls.
export default function KeyboardShortcutsProvider() {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable

      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        router.push('/transactions/new')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}