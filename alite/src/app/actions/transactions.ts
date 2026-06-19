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
  exchange_rate_used: number
  base_currency_amount: number
  category_id: string
  description: string
  happened_at: string
}

export interface CreateTransferInput {
  from_account_id: string
  to_account_id: string
  from_amount: number
  to_amount: number
  from_currency: string
  to_currency: string
  exchange_rate: number
  description: string
  happened_at: string
}

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
}

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateAmount(amount: number): string | null {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Amount must be a number.'
  if (amount <= 0) return 'Amount must be greater than zero.'
  if (amount > 999_999_999_999) return 'Amount is unrealistically large.'
  return null
}

function validateDate(dateStr: string): string | null {
  if (!dateStr) return 'Date is required.'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Invalid date.'
  const year = d.getFullYear()
  if (year < 1900 || year > 2100) return 'Date out of valid range.'
  return null
}

function validateUUID(value: string, label: string): string | null {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return `${label} is required.`
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(value.trim())) return `${label} is invalid.`
  return null
}

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
    // Also try the inverse rate
    const { data: inverseData, error: inverseError } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', toCurrency)
      .eq('to_currency', fromCurrency)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (inverseError || !inverseData) {
      return {
        rate: 0,
        error: `No exchange rate found for ${fromCurrency} → ${toCurrency}. Please add rates in your settings or enter the amount manually.`,
      }
    }

    return { rate: parseFloat((1 / inverseData.rate).toFixed(10)) }
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

// ─── Create transaction (atomic via RPC) ──────────────────────────────────────

export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  // ── Server-side validation ──
  const amtErr = validateAmount(input.amount)
  if (amtErr) return { error: amtErr }

  const dateErr = validateDate(input.happened_at)
  if (dateErr) return { error: dateErr }

  const acctErr = validateUUID(input.account_id, 'Account')
  if (acctErr) return { error: acctErr }

  const catErr = validateUUID(input.category_id, 'Category')
  if (catErr) return { error: catErr }

  if (!['income', 'expense'].includes(input.type)) {
    return { error: 'Invalid transaction type.' }
  }

  if (input.exchange_rate_used <= 0) {
    return { error: 'Exchange rate must be positive. Missing rate for this currency pair.' }
  }

  // Recompute base_currency_amount server-side to prevent tampering
  const expectedBase = parseFloat(
    (input.amount * input.exchange_rate_used).toFixed(2)
  )
  const delta = Math.abs(expectedBase - input.base_currency_amount)
  if (delta > 0.02) {
    return { error: 'Base currency amount mismatch — please refresh and retry.' }
  }

  // Verify the account belongs to this user
  const { data: account, error: acctFetchErr } = await supabase
    .from('accounts')
    .select('id, currency')
    .eq('id', input.account_id)
    .eq('user_id', user.id)
    .single()

  if (acctFetchErr || !account) {
    return { error: 'Account not found or access denied.' }
  }

  // ── Try atomic RPC first; fall back to two-step if RPC doesn't exist ──
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'create_transaction_atomic',
    {
      p_user_id: user.id,
      p_account_id: input.account_id,
      p_type: input.type,
      p_amount: input.amount,
      p_currency: input.currency,
      p_exchange_rate: input.exchange_rate_used,
      p_base_amount: expectedBase,
      p_category_id: input.category_id,
      p_description: input.description || null,
      p_happened_at: input.happened_at,
    }
  )

  if (!rpcError && rpcResult) {
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
    revalidatePath(`/accounts/${input.account_id}`)
    return { success: true, id: rpcResult as string }
  }

  // ── Two-step fallback (non-atomic, but safe with rollback) ──
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: input.account_id,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      exchange_rate_used: input.exchange_rate_used,
      base_currency_amount: expectedBase,
      category_id: input.category_id,
      description: input.description || null,
      date: input.happened_at,
      transfer_id: null,
    })
    .select('id')
    .single()

  if (txError) return { error: txError.message }

  const balanceDelta = input.type === 'income' ? input.amount : -input.amount
  const { error: balanceError } = await supabase.rpc('increment_account_balance', {
    p_account_id: input.account_id,
    p_delta: balanceDelta,
  })

  if (balanceError) {
    // Rollback: delete the transaction we just created
    await supabase.from('transactions').delete().eq('id', tx.id)
    return {
      error:
        'Failed to update account balance. Transaction was not saved. ' +
        'Please ensure the `increment_account_balance` RPC exists in Supabase.',
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${input.account_id}`)

  return { success: true, id: tx.id }
}

// ─── Create Transfer (atomic: debit A, credit B) ──────────────────────────────

export async function createTransfer(
  input: CreateTransferInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  // ── Validation ──
  const fromErr = validateUUID(input.from_account_id, 'Source account')
  if (fromErr) return { error: fromErr }

  const toErr = validateUUID(input.to_account_id, 'Destination account')
  if (toErr) return { error: toErr }

  if (input.from_account_id === input.to_account_id) {
    return { error: 'Source and destination accounts must be different.' }
  }

  const amtErr = validateAmount(input.from_amount)
  if (amtErr) return { error: amtErr }

  const toAmtErr = validateAmount(input.to_amount)
  if (toAmtErr) return { error: `Destination ${toAmtErr.toLowerCase()}` }

  const dateErr = validateDate(input.happened_at)
  if (dateErr) return { error: dateErr }

  if (input.exchange_rate <= 0) {
    return { error: 'Exchange rate must be positive.' }
  }

  // Verify both accounts belong to this user
  const { data: accounts, error: acctErr } = await supabase
    .from('accounts')
    .select('id, balance, currency')
    .in('id', [input.from_account_id, input.to_account_id])
    .eq('user_id', user.id)

  if (acctErr || !accounts || accounts.length < 2) {
    return { error: 'One or both accounts not found or access denied.' }
  }

  const fromAccount = accounts.find((a: { id: string; balance: number; currency: string }) => a.id === input.from_account_id)
  if (!fromAccount) return { error: 'Source account not found.' }

  // ── Try atomic RPC ──
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'create_transfer_atomic',
    {
      p_user_id: user.id,
      p_from_account_id: input.from_account_id,
      p_to_account_id: input.to_account_id,
      p_from_amount: input.from_amount,
      p_to_amount: input.to_amount,
      p_from_currency: input.from_currency,
      p_to_currency: input.to_currency,
      p_exchange_rate: input.exchange_rate,
      p_description: input.description || null,
      p_happened_at: input.happened_at,
    }
  )

  if (!rpcError && rpcResult) {
    revalidatePath('/dashboard')
    revalidatePath('/transactions')
    revalidatePath(`/accounts/${input.from_account_id}`)
    revalidatePath(`/accounts/${input.to_account_id}`)
    return { success: true, id: rpcResult as string }
  }

  // ── Multi-step fallback ──
  // Step 1: Create the transfer record
  const { data: transfer, error: transferErr } = await supabase
    .from('transfers')
    .insert({
      user_id: user.id,
      from_account_id: input.from_account_id,
      to_account_id: input.to_account_id,
      from_amount: input.from_amount,
      to_amount: input.to_amount,
      from_currency: input.from_currency,
      to_currency: input.to_currency,
      exchange_rate: input.exchange_rate,
      date: input.happened_at,
      description: input.description || null,
    })
    .select('id')
    .single()

  if (transferErr || !transfer) {
    return { error: `Failed to create transfer record: ${transferErr?.message}` }
  }

  // Step 2: Create debit transaction (money leaving from_account)
  const { data: debitTx, error: debitErr } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: input.from_account_id,
      type: 'transfer',
      amount: input.from_amount,
      currency: input.from_currency,
      exchange_rate_used: 1,
      base_currency_amount: input.from_amount,
      date: input.happened_at,
      description: input.description || `Transfer to account`,
      transfer_id: transfer.id,
      transfer_type: 'debit',
    })
    .select('id')
    .single()

  if (debitErr || !debitTx) {
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return { error: `Failed to create debit transaction: ${debitErr?.message}` }
  }

  // Step 3: Create credit transaction (money arriving at to_account)
  const { data: creditTx, error: creditErr } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: input.to_account_id,
      type: 'transfer',
      amount: input.to_amount,
      currency: input.to_currency,
      exchange_rate_used: input.exchange_rate,
      base_currency_amount: input.to_amount,
      date: input.happened_at,
      description: input.description || `Transfer from account`,
      transfer_id: transfer.id,
      transfer_type: 'credit',
    })
    .select('id')
    .single()

  if (creditErr || !creditTx) {
    // Rollback debit tx and transfer record
    await supabase.from('transactions').delete().eq('id', debitTx.id)
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return { error: `Failed to create credit transaction: ${creditErr?.message}` }
  }

  // Step 4: Update both account balances atomically via RPC
  const { error: fromBalErr } = await supabase.rpc('increment_account_balance', {
    p_account_id: input.from_account_id,
    p_delta: -input.from_amount,
  })

  if (fromBalErr) {
    // Full rollback
    await supabase.from('transactions').delete().in('id', [debitTx.id, creditTx.id])
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return { error: 'Failed to debit source account. Transfer was not saved.' }
  }

  const { error: toBalErr } = await supabase.rpc('increment_account_balance', {
    p_account_id: input.to_account_id,
    p_delta: input.to_amount,
  })

  if (toBalErr) {
    // Reverse the debit we already applied
    await supabase.rpc('increment_account_balance', {
      p_account_id: input.from_account_id,
      p_delta: input.from_amount,
    })
    await supabase.from('transactions').delete().in('id', [debitTx.id, creditTx.id])
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return { error: 'Failed to credit destination account. Transfer was not saved.' }
  }

  // Step 5: Link transaction IDs back to transfer record
  await supabase
    .from('transfers')
    .update({
      debit_transaction_id: debitTx.id,
      credit_transaction_id: creditTx.id,
    })
    .eq('id', transfer.id)

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${input.from_account_id}`)
  revalidatePath(`/accounts/${input.to_account_id}`)

  return { success: true, id: transfer.id }
}

// ─── Delete transaction ────────────────────────────────────────────────────────

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(id, 'Transaction ID')
  if (idErr) return { error: idErr }

  // Fetch the transaction — MUST belong to this user
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('id, account_id, type, amount, transfer_id, transfer_type')
    .eq('id', id)
    .eq('user_id', user.id) // ownership check
    .single()

  if (fetchError || !tx) {
    return { error: 'Transaction not found or access denied.' }
  }

  if (tx.type === 'transfer') {
    return {
      error:
        'Cannot delete a single transfer leg. Delete the entire transfer instead.',
    }
  }

  // Reverse the balance change
  const balanceDelta = tx.type === 'income' ? -tx.amount : tx.amount

  const { error: balErr } = await supabase.rpc('increment_account_balance', {
    p_account_id: tx.account_id,
    p_delta: balanceDelta,
  })

  if (balErr) {
    return {
      error:
        'Failed to reverse account balance. Transaction was not deleted to prevent desync.',
    }
  }

  const { error: delErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // double-check ownership

  if (delErr) {
    // Re-apply the balance (undo our reversal)
    await supabase.rpc('increment_account_balance', {
      p_account_id: tx.account_id,
      p_delta: -balanceDelta,
    })
    return { error: delErr.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${tx.account_id}`)
  return { success: true }
}

// ─── Delete transfer ───────────────────────────────────────────────────────────

export async function deleteTransfer(transferId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(transferId, 'Transfer ID')
  if (idErr) return { error: idErr }

  const { data: transfer, error: fetchErr } = await supabase
    .from('transfers')
    .select(
      'id, from_account_id, to_account_id, from_amount, to_amount, debit_transaction_id, credit_transaction_id'
    )
    .eq('id', transferId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr || !transfer) {
    return { error: 'Transfer not found or access denied.' }
  }

  // Reverse balances first
  const { error: fromBalErr } = await supabase.rpc('increment_account_balance', {
    p_account_id: transfer.from_account_id,
    p_delta: transfer.from_amount, // add back what was debited
  })
  if (fromBalErr) return { error: 'Failed to reverse source balance.' }

  const { error: toBalErr } = await supabase.rpc('increment_account_balance', {
    p_account_id: transfer.to_account_id,
    p_delta: -transfer.to_amount, // remove what was credited
  })

  if (toBalErr) {
    // Re-reverse the from_account change
    await supabase.rpc('increment_account_balance', {
      p_account_id: transfer.from_account_id,
      p_delta: -transfer.from_amount,
    })
    return { error: 'Failed to reverse destination balance.' }
  }

  // Delete transaction legs (they reference transfer via FK)
  const legIds = [
    transfer.debit_transaction_id,
    transfer.credit_transaction_id,
  ].filter(Boolean)

  if (legIds.length) {
    await supabase.from('transactions').delete().in('id', legIds)
  }

  const { error: delErr } = await supabase
    .from('transfers')
    .delete()
    .eq('id', transferId)
    .eq('user_id', user.id)

  if (delErr) return { error: delErr.message }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${transfer.from_account_id}`)
  revalidatePath(`/accounts/${transfer.to_account_id}`)
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

  const amtErr = validateAmount(fields.balance === 0 ? 1 : Math.abs(fields.balance))
  // balance can be 0 for new accounts — only reject negatives
  if (fields.balance < 0) return { error: 'Opening balance cannot be negative.' }

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...fields, user_id: user.id, is_active: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')

  // redirect OUTSIDE try/catch — Next.js throws internally on redirect()
  redirect(`/accounts/${data.id}`)
}

// ─── Update account ───────────────────────────────────────────────────────────

export async function updateAccount(
  accountId: string,
  fields: { name?: string; type?: string; color?: string ; include_in_net_worth?: boolean}
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(accountId, 'Account ID')
  if (idErr) return { error: idErr }

  const { error } = await supabase
    .from('accounts')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', accountId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath(`/accounts/${accountId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function archiveAccount(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(id, 'Account ID')
  if (idErr) return { error: idErr }

  const { error } = await supabase
    .from('accounts')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')

  redirect('/accounts')
}

export interface CreateBudgetInput {
  category_id: string | null
  name: string
  amount: number
  currency: string
  period: 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
}

export async function createBudget(
  input: CreateBudgetInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const amtErr = validateAmount(input.amount)
  if (amtErr) return { error: amtErr }

  const dateErr = validateDate(input.start_date)
  if (dateErr) return { error: dateErr }

  if (input.end_date) {
    const endDateErr = validateDate(input.end_date)
    if (endDateErr) return { error: endDateErr }
  }

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      ...input,
      user_id: user.id,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/budgets')

  return {
    success: true,
    id: data.id,
  }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(id, 'Budget ID')
  if (idErr) return { error: idErr }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/budgets')

  return { success: true }
}