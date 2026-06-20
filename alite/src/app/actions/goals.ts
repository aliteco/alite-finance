'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
}

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

function validateAmount(amount: number): string | null {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Amount must be a number.'
  if (amount <= 0) return 'Amount must be greater than zero.'
  if (amount > 999_999_999_999) return 'Amount is unrealistically large.'
  return null
}

export interface CreateGoalInput {
  name: string
  description: string | null
  target_amount: number
  currency: string
  target_date: string | null
  icon: string
  color: string
}

export async function createGoal(input: CreateGoalInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  if (!input.name.trim()) return { error: 'Give this goal a name.' }
  const amtErr = validateAmount(input.target_amount)
  if (amtErr) return { error: amtErr }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: input.description,
      target_amount: input.target_amount,
      currency: input.currency,
      target_date: input.target_date,
      icon: input.icon,
      color: input.color,
      current_amount: 0,
      is_active: true,
      is_completed: false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/goals')
  redirect(`/goals/${data.id}`)
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/goals')
  return { success: true }
}

export interface AddContributionInput {
  goal_id: string
  account_id: string | null
  amount: number
  currency: string
  exchange_rate: number
  date: string
  notes: string | null
}

export async function addGoalContribution(input: AddContributionInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const amtErr = validateAmount(input.amount)
  if (amtErr) return { error: amtErr }

  // Verify goal belongs to user
  const { data: goal, error: goalErr } = await supabase
    .from('goals')
    .select('id, current_amount, target_amount, currency')
    .eq('id', input.goal_id)
    .eq('user_id', user.id)
    .single()

  if (goalErr || !goal) return { error: 'Goal not found or access denied.' }

  const baseCurrencyAmount = parseFloat((input.amount * input.exchange_rate).toFixed(2))

  const { error: contribErr } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: input.goal_id,
      user_id: user.id,
      account_id: input.account_id,
      amount: input.amount,
      currency: input.currency,
      exchange_rate: input.exchange_rate,
      base_currency_amount: baseCurrencyAmount,
      date: input.date,
      notes: input.notes,
    })

  if (contribErr) return { error: contribErr.message }

  const newAmount = goal.current_amount + baseCurrencyAmount
  const isCompleted = newAmount >= goal.target_amount

  const { error: updateErr } = await supabase
    .from('goals')
    .update({
      current_amount: newAmount,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.goal_id)

  if (updateErr) {
    // Roll back the contribution if updating the goal fails
    await supabase
      .from('goal_contributions')
      .delete()
      .eq('goal_id', input.goal_id)
      .eq('date', input.date)
      .eq('amount', input.amount)
    return { error: 'Failed to update goal progress.' }
  }

  // Optionally debit the source account balance
  if (input.account_id) {
    await supabase.rpc('increment_account_balance', {
      p_account_id: input.account_id,
      p_delta: -input.amount,
    })
  }

  revalidatePath('/goals')
  revalidatePath(`/goals/${input.goal_id}`)
  return { success: true }
}