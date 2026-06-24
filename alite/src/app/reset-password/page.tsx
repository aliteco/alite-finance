'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { updatePassword } from '@/lib/supabase/auth'
import { AuthLayout } from '@/components/auth/auth-layout'

function getPasswordStrength(password: string) {
  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', color: 'text-expense', width: '33%' }
  if (score <= 3) return { label: 'Good', color: 'text-muted-foreground-strong', width: '66%' }
  return { label: 'Strong', color: 'text-income', width: '100%' }
}

function mapAuthError(error: any) {
  const msg = typeof error === 'string' ? error : error?.message || ''
  const lower = msg.toLowerCase()

  if (lower.includes('session') || lower.includes('expired') || lower.includes('invalid')) {
    return 'This reset link has expired or already been used. Please request a new one.'
  }
  if (lower.includes('password')) {
    return 'Password does not meet requirements.'
  }

  return 'Something went wrong. Please try again.'
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords don’t match.')
      return
    }

    setLoading(true)

    try {
      const result = await updatePassword(password)

      if (result?.error) {
        setError(mapAuthError(result.error))
      }
      // On success the server action redirects to /dashboard.
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = password && confirmPassword && !loading

  return (
    <AuthLayout
      panelTitle="Almost done."
      panelBody="Choose a new password and you’ll be straight back into your accounts — nothing else changes."
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose something you haven&apos;t used before
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New password */}
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            New password
          </label>

          <div className="relative mt-1">
            <input
              id="password"
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="w-full h-11 rounded-xl border border-border bg-background px-4 pr-12 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {password && (
            <div className="mt-2">
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${strength.color} bg-current`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className={`text-xs mt-1 ${strength.color}`}>{strength.label} password</p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="mt-1 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
            {error.includes('expired') && (
              <>
                {' '}
                <Link href="/forgot-password" className="underline font-medium">
                  Request a new link
                </Link>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Updating…
            </span>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </AuthLayout>
  )
}
