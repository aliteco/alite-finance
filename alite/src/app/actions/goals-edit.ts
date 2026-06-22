// filepath: alite/src/app/actions/goals-edit.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  error?: string
  success?: boolean
}

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

export interface UpdateGoalInput {
  name: string
  description: string | null
  target_amount: number
  target_date: string | null
  icon: string
  color: string
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  if (!input.name.trim()) return { error: 'Give this goal a name.' }
  if (!input.target_amount || input.target_amount <= 0) {
    return { error: 'Enter a valid target amount.' }
  }

  const { data: goal, error: fetchErr } = await supabase
    .from('goals')
    .select('current_amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !goal) return { error: 'Goal not found or access denied.' }

  const isCompleted = goal.current_amount >= input.target_amount

  const { error } = await supabase
    .from('goals')
    .update({
      name: input.name.trim(),
      description: input.description,
      target_amount: input.target_amount,
      target_date: input.target_date,
      icon: input.icon,
      color: input.color,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/goals')
  revalidatePath(`/goals/${id}`)
  return { success: true }
}