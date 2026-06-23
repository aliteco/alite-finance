'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/lib/supabase/auth'

function getPasswordStrength(password: string) {
  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', color: 'text-red-500', width: '25%' }
  if (score === 2) return { label: 'Fair', color: 'text-yellow-500', width: '50%' }
  if (score === 3) return { label: 'Good', color: 'text-blue-500', width: '75%' }
  return { label: 'Strong', color: 'text-green-500', width: '100%' }
}

function mapAuthError(error: any) {
  const msg = typeof error === 'string' ? error : error?.message || ''

  if (msg.toLowerCase().includes('already registered')) {
    return 'An account with this email already exists.'
  }
  if (msg.toLowerCase().includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (msg.toLowerCase().includes('password')) {
    return 'Password does not meet requirements.'
  }

  return 'Something went wrong. Please try again.'
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = useMemo(
    () => getPasswordStrength(password),
    [password]
  )

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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
        // 🔥 realistic Supabase flow (email confirmation)
        setSuccess(
          result?.success ||
            'Check your email to confirm your account before signing in.'
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
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card shadow-sm p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">
                A
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Create account
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking your finances
            </p>
          </div>

          {/* Success */}
          {success ? (
            <div className="text-center space-y-4">
              <div className="rounded-xl bg-green-500/10 text-green-600 px-4 py-3 text-sm">
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
                  <label className="text-sm font-medium">Full name</label>
                  <input
                    disabled={loading}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    placeholder="Jane Doe"
                    className="mt-1 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60 focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="mt-1 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60 focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-medium">Password</label>

                  <input
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Min. 8 characters"
                    className="mt-1 w-full h-11 rounded-xl border border-border bg-background px-4 text-sm disabled:opacity-60 focus:ring-2 focus:ring-primary/40"
                  />

                  {/* Strength meter */}
                  {password && (
                    <div className="mt-2">
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>

                      <p className={`text-xs mt-1 ${strength.color}`}>
                        {strength.label} password
                      </p>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground mt-1">
                    Must be at least 8 characters
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
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
        </div>
      </div>
    </div>
  )
}