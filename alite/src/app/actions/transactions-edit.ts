// filepath: alite/src/app/actions/transactions-edit.ts
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

export interface UpdateTransactionDetailsInput {
  category_id: string
  description: string
  date: string
}

// Intentionally only allows editing category/description/date — never
// amount, currency, or account, since those affect account.balance and
// must go through the create/delete RPC path to stay consistent.
export async function updateTransactionDetails(
  id: string,
  input: UpdateTransactionDetailsInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const { data: tx, error: fetchErr } = await supabase
    .from('transactions')
    .select('id, type, transfer_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr || !tx) return { error: 'Transaction not found or access denied.' }
  if (tx.transfer_id || tx.type === 'transfer') {
    return { error: 'Transfer legs cannot be edited directly.' }
  }

  const d = new Date(input.date)
  if (isNaN(d.getTime())) return { error: 'Invalid date.' }

  const { error } = await supabase
    .from('transactions')
    .update({
      category_id: input.category_id,
      description: input.description || null,
      date: input.date,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/transactions/${id}`)
  revalidatePath('/budgets')
  return { success: true }
}