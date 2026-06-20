'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function safeRedirectPath(path: string | undefined): string {
  // Prevent open-redirect: only allow same-origin relative paths.
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  return path
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