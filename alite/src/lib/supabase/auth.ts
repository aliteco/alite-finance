'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }   // ← always a plain string
  }

  redirect('/dashboard')
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
    return { error: error.message }   // ← always a plain string
  }

  // Supabase returns a fake session when email confirmation is disabled.
  // Detect both cases: confirmation required vs auto-confirmed.
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