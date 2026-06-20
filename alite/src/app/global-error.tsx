'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
          padding: '24px',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 380 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 20 }}>
              The app failed to load. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                height: 40,
                padding: '0 20px',
                borderRadius: 12,
                background: '#fafafa',
                color: '#09090b',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}