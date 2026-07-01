// filepath: alite/src/hooks/use-privacy-mode.ts
'use client'

import { useState, useEffect } from 'react'

export function usePrivacyMode() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const check = () => {
      setEnabled(localStorage.getItem('alite_privacy_mode') === 'true')
    }
    check()
    window.addEventListener('alite_privacy_changed', check)
    return () => window.removeEventListener('alite_privacy_changed', check)
  }, [])

  return enabled
}