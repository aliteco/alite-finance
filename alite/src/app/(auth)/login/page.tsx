'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/supabase/auth'

function mapAuthError(error: any) {
  const msg = typeof error === 'string' ? error : error?.message || ''

  if (msg.toLowerCase().includes('invalid login')) {
    return 'Incorrect email or password.'
  }
  if (msg.toLowerCase().includes('user not found')) {
    return 'No account found with this email.'
  }
  if (msg.toLowerCase().includes('email not confirmed')) {
    return 'Please verify your email before signing in.'
  }

  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const result = await signIn(email, password, redirectTo)

      if (result?.error) {
        setError(mapAuthError(result.error))
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email && password && !loading

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                A
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to continue to Alite
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium">
              Create one
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}