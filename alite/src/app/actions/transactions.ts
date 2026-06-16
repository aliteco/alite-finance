'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense'

export interface CreateTransactionInput {
  account_id: string
  type: TransactionType
  amount: number
  currency: string
  exchange_rate_used: number        // rate: account_currency → base_currency
  base_currency_amount: number      // amount * exchange_rate_used, computed client-side, validated here
  category_id: string
  description: string
  happened_at: string               // ISO date string
}

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

// ─── Exchange rate lookup ──────────────────────────────────────────────────────

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; error?: string }> {
  if (fromCurrency === toCurrency) return { rate: 1 }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return { rate: 1, error: `No rate found for ${fromCurrency}→${toCurrency}` }
  }
  return { rate: data.rate }
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(type?: TransactionType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('categories')
    .select('id, name, type, is_system')
    .or(`user_id.is.null,user_id.eq.${user?.id}`)
    .order('is_system', { ascending: false })
    .order('name')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// ─── Create transaction ────────────────────────────────────────────────────────

export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  // Server-side validation: recompute base_currency_amount to prevent tampering
  const expectedBase = parseFloat(
    (input.amount * input.exchange_rate_used).toFixed(2)
  )
  const delta = Math.abs(expectedBase - input.base_currency_amount)
  if (delta > 0.01) {
    return { error: 'Base currency amount mismatch — please refresh and retry.' }
  }

  // Insert transaction
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: input.account_id,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      exchange_rate_used: input.exchange_rate_used,
      base_currency_amount: input.base_currency_amount,
      category_id: input.category_id,
      description: input.description || null,
      happened_at: input.happened_at,
      transfer_id: null,
    })
    .select('id')
    .single()

  if (txError) return { error: txError.message }

  // Update account balance
  const balanceDelta = input.type === 'income' ? input.amount : -input.amount
  const { error: balanceError } = await supabase.rpc('increment_account_balance', {
    p_account_id: input.account_id,
    p_delta: balanceDelta,
  })

  if (balanceError) {
    // Rollback transaction
    await supabase.from('transactions').delete().eq('id', tx.id)
    return { error: 'Failed to update account balance.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${input.account_id}`)

  return { success: true, id: tx.id }
}

// ─── Delete transaction ────────────────────────────────────────────────────────

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  // Fetch first to reverse balance
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('account_id, type, amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !tx) return { error: 'Transaction not found.' }
  if (tx.type === null) return { error: 'Cannot delete a transfer leg directly.' }

  const balanceDelta = tx.type === 'income' ? -tx.amount : tx.amount
  await supabase.rpc('increment_account_balance', {
    p_account_id: tx.account_id,
    p_delta: balanceDelta,
  })

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${tx.account_id}`)
  return { success: true }
}

// ─── Update profile settings ───────────────────────────────────────────────────

export async function updateProfile(fields: {
  base_currency?: string
  full_name?: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const { error } = await supabase
    .from('profiles')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Create account ───────────────────────────────────────────────────────────

export async function createAccount(fields: {
  name: string
  type: string
  currency: string
  balance: number
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...fields, user_id: user.id, is_active: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  redirect(`/accounts/${data.id}`)
}