'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

function safeRedirectPath(path: string | undefined): string {
  // Prevent open-redirect: only allow same-origin relative paths.
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  return path
}

async function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL

  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

export async function signIn(email: string, password: string, redirectTo?: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect(safeRedirectPath(redirectTo))
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (error) {
    console.error('Supabase signUp error:', error.name, error.status, error.message)
    return { error: error.message || 'Failed to sign up. Please try again.' }
  }

  if (data.session) {
    redirect('/dashboard')
  }

  return {
    success: 'Check your email and click the confirmation link to activate your account.',
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const origin = await getOrigin()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  })

  if (error) {
    const lower = error.message.toLowerCase()

    // Surface real failures (rate limiting, malformed input) but never
    // reveal whether an account exists for this email.
    if (lower.includes('rate limit')) {
      return { error: 'Too many requests. Please wait a moment and try again.' }
    }
    if (lower.includes('invalid')) {
      return { error: 'Please enter a valid email address.' }
    }

    console.error('Supabase resetPasswordForEmail error:', error.name, error.status, error.message)
  }

  return {
    success: "If an account exists for that email, we've sent a link to reset your password.",
  }
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message || 'Failed to update password. Please try again.' }
  }

  redirect('/dashboard')
}
