'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/supabase/auth'
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

  if (lower.includes('already registered')) {
    return 'An account with this email already exists.'
  }
  if (lower.includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (lower.includes('password')) {
    return 'Password does not meet requirements.'
  }

  return 'Something went wrong. Please try again.'
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const result = await signUp(email, password, fullName)

      if (result?.error) {
        setError(mapAuthError(result.error))
      } else {
        setSuccess(
          result?.success || 'Check your email to confirm your account before signing in.'
        )

        setFullName('')
        setEmail('')
        setPassword('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = loading || !email || !password || !fullName

  return (
    <AuthLayout
      panelTitle="Money in multiple currencies. One honest total."
      panelBody="Every account you add keeps its own currency, and every transfer between them stays out of your income and expenses — by default, not by remembering to flag it."
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground mt-1">Start tracking your finances</p>
      </div>

      {/* Success */}
      {success ? (
        <div className="text-center space-y-4">
          <div className="rounded-xl bg-income-muted text-income px-4 py-3 text-sm">
            {success}
          </div>

          <Link href="/login" className="text-sm text-primary font-medium">
            Go to sign in
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="fullName"
                disabled={loading}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                className="mt-1 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
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

              {/* Strength meter */}
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

              <p className="text-[11px] text-muted-foreground mt-1">
                Must be at least 8 characters
              </p>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              disabled={isDisabled}
              type="submit"
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
