'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/supabase/auth'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(result?.success || "If an account exists for that email, we've sent a reset link.")
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      panelTitle="Locked out happens. Your numbers stay put."
      panelBody="Resetting your password doesn’t touch your accounts, transactions, or history — everything is exactly where you left it."
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {success ? (
        <div className="text-center space-y-4">
          <div className="rounded-xl bg-income-muted text-income px-4 py-3 text-sm">
            {success}
          </div>
          <Link href="/login" className="text-sm text-primary font-medium">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <div role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!email || loading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending link…
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remembered it?{' '}
            <Link href="/login" className="text-primary font-medium">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
