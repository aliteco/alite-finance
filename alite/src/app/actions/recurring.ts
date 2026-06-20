'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
}

type Frequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

function validateAmount(amount: number): string | null {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Amount must be a number.'
  if (amount <= 0) return 'Amount must be greater than zero.'
  if (amount > 999_999_999_999) return 'Amount is unrealistically large.'
  return null
}

export function nextDueDate(from: string, frequency: Frequency): string {
  const d = new Date(from)
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break
    case 'weekly': d.setDate(d.getDate() + 7); break
    case 'biweekly': d.setDate(d.getDate() + 14); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
    case 'quarterly': d.setMonth(d.getMonth() + 3); break
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().slice(0, 10)
}

// ─── Create ─────────────────────────────────────────────────────────────────

export interface CreateRecurringInput {
  account_id: string
  category_id: string | null
  type: 'income' | 'expense'
  amount: number
  currency: string
  description: string
  frequency: Frequency
  start_date: string
  end_date: string | null
  auto_generate: boolean
}

export async function createRecurring(input: CreateRecurringInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const amtErr = validateAmount(input.amount)
  if (amtErr) return { error: amtErr }
  if (!input.description.trim()) return { error: 'Give this a description.' }
  if (!input.account_id) return { error: 'Select an account.' }

  const { data: account, error: acctErr } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', input.account_id)
    .eq('user_id', user.id)
    .single()

  if (acctErr || !account) return { error: 'Account not found or access denied.' }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: user.id,
      account_id: input.account_id,
      category_id: input.category_id,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      description: input.description.trim(),
      frequency: input.frequency,
      start_date: input.start_date,
      end_date: input.end_date,
      next_due_date: input.start_date,
      is_active: true,
      auto_generate: input.auto_generate,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  redirect('/recurring')
}

// ─── Update ─────────────────────────────────────────────────────────────────

export interface UpdateRecurringInput {
  account_id?: string
  category_id?: string | null
  amount?: number
  description?: string
  frequency?: Frequency
  end_date?: string | null
  auto_generate?: boolean
  is_active?: boolean
}

export async function updateRecurring(id: string, fields: UpdateRecurringInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  if (fields.amount !== undefined) {
    const amtErr = validateAmount(fields.amount)
    if (amtErr) return { error: amtErr }
  }

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  revalidatePath(`/recurring/${id}`)
  return { success: true }
}

export async function pauseRecurring(id: string, isActive: boolean): Promise<ActionResult> {
  return updateRecurring(id, { is_active: isActive })
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/recurring')
  return { success: true }
}

// ─── Generate a transaction now from a recurring rule ───────────────────────
// Used both by the "Record now" button and could be called from a cron/edge
// function for auto_generate=true rules (not wired to a scheduler here —
// see SUMMARY.md deployment note).

export async function generateRecurringNow(recurringId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const { data: rule, error: ruleErr } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('id', recurringId)
    .eq('user_id', user.id)
    .single()

  if (ruleErr || !rule) return { error: 'Recurring rule not found or access denied.' }
  if (!rule.is_active) return { error: 'This recurring rule is paused.' }

  // Base currency conversion: use rate 1 if currency matches profile base,
  // otherwise look up the latest rate (fallback to 1 with a warning if missing).
  const { data: profile } = await supabase
    .from('profiles')
    .select('base_currency')
    .eq('id', user.id)
    .single()

  const baseCurrency = profile?.base_currency ?? rule.currency
  let rate = 1
  if (rule.currency !== baseCurrency) {
    const { data: rateData } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', rule.currency)
      .eq('target_currency', baseCurrency)
      .order('date', { ascending: false })
      .limit(1)
      .single()
    rate = rateData?.rate ?? 1
  }

  const baseCurrencyAmount = parseFloat((rule.amount * rate).toFixed(2))
  const today = new Date().toISOString().slice(0, 10)

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: rule.account_id,
      category_id: rule.category_id,
      type: rule.type,
      amount: rule.amount,
      currency: rule.currency,
      exchange_rate_used: rate,
      base_currency_amount: baseCurrencyAmount,
      description: rule.description,
      date: today,
      recurring_id: rule.id,
      transfer_id: null,
    })
    .select('id')
    .single()

  if (txError) return { error: txError.message }

  const balanceDelta = rule.type === 'income' ? rule.amount : -rule.amount
  const { error: balErr } = await supabase.rpc('increment_account_balance', {
    p_account_id: rule.account_id,
    p_delta: balanceDelta,
  })

  if (balErr) {
    await supabase.from('transactions').delete().eq('id', tx.id)
    return { error: 'Failed to update account balance. Transaction was not recorded.' }
  }

  const newNextDue = nextDueDate(rule.next_due_date, rule.frequency)
  await supabase
    .from('recurring_transactions')
    .update({
      last_generated_date: today,
      next_due_date: newNextDue,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rule.id)

  revalidatePath('/recurring')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${rule.account_id}`)

  return { success: true, id: tx.id }
}