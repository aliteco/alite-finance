// filepath: alite/src/app/actions/transactions.ts
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

function accountTypeAllowsNegativeBalance(type: string): boolean {
  return type === 'credit_card'
}

// ─── Exchange rate lookup ──────────────────────────────────────────────────────
// Returns the multiplicative rate such that: amount_in_from * rate = amount_in_to
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; error?: string }> {
  if (fromCurrency === toCurrency) return { rate: 1 }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate')
    .eq('base_currency', fromCurrency)
    .eq('target_currency', toCurrency)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { rate: 0, error: `Exchange rate lookup failed: ${error.message}` }
  }

  if (!data) {
    const { data: inverseData, error: inverseError } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('base_currency', toCurrency)
      .eq('target_currency', fromCurrency)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (inverseError || !inverseData || !inverseData.rate) {
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
  if (!user) return []

  let query = supabase
    .from('categories')
    .select('id, name, type, is_system')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order('is_system', { ascending: false })
    .order('name')

  if (type) query = query.eq('type', type)

  const { data, error } = await query
  if (error) return []
  return data ?? []
}

// ─── Create transaction (atomic via trigger, RPC fallback) ──────────────────

export async function createTransaction(
  input: CreateTransactionInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

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

  // FIX: was dividing (input.amount / input.exchange_rate_used). The rate is
  // defined as "currency -> base" (matches getExchangeRate's contract and the
  // client's calculation in transaction-form.tsx), so the correct conversion
  // is amount * rate, not amount / rate. The previous version rejected nearly
  // every cross-currency transaction with a false "mismatch" error.
  const expectedBase = parseFloat(
    (input.amount * input.exchange_rate_used).toFixed(2)
  )
  const delta = Math.abs(expectedBase - input.base_currency_amount)
  if (delta > 0.02) {
    return { error: 'Base currency amount mismatch — please refresh and retry.' }
  }

  const { data: account, error: acctFetchErr } = await supabase
    .from('accounts')
    .select('id, currency, balance')
    .eq('id', input.account_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (acctFetchErr || !account) {
    return { error: 'Account not found or access denied.' }
  }

  const balanceBefore = account.balance ?? 0

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

  // Fetch account's balance after inserting to see if a DB trigger modified it.
  const { data: acctAfter } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.account_id)
    .single()

  const balanceAfter = acctAfter?.balance ?? 0
  const isBalanceUpdatedByTrigger = Math.abs(balanceAfter - balanceBefore) > 0.001

  if (!isBalanceUpdatedByTrigger && input.amount !== 0) {
    const targetAmount = account.currency === input.currency ? input.amount : expectedBase
    const balanceDelta = input.type === 'income' ? targetAmount : -targetAmount

    const { error: balanceError } = await supabase.rpc('increment_account_balance', {
      p_account_id: input.account_id,
      p_delta: balanceDelta,
    })

    if (balanceError) {
      await supabase.from('transactions').delete().eq('id', tx.id)
      return {
        error:
          'Failed to update account balance. Transaction was not saved. ' +
          'Please ensure the `increment_account_balance` RPC exists in Supabase.',
      }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${input.account_id}`)
  revalidatePath('/budgets')

  return { success: true, id: tx.id }
}

// ─── Create Transfer (atomic: debit A, credit B) ──────────────────────────────

export async function createTransfer(
  input: CreateTransferInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

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

  const { data: accounts, error: acctErr } = await supabase
    .from('accounts')
    .select('id, balance, currency')
    .in('id', [input.from_account_id, input.to_account_id])
    .eq('user_id', user.id)

  if (acctErr || !accounts || accounts.length < 2) {
    return { error: 'One or both accounts not found or access denied.' }
  }

  const fromAcctObj = accounts.find(a => a.id === input.from_account_id)
  const toAcctObj = accounts.find(a => a.id === input.to_account_id)

  const fromBalBefore = fromAcctObj?.balance ?? 0
  const toBalBefore = toAcctObj?.balance ?? 0

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

  const { data: creditTx, error: creditErr } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: input.to_account_id,
      type: 'transfer',
      amount: input.to_amount,
      currency: input.to_currency,
      exchange_rate_used: input.exchange_rate,
      base_currency_amount: input.from_amount,
      date: input.happened_at,
      description: input.description || `Transfer from account`,
      transfer_id: transfer.id,
      transfer_type: 'credit',
    })
    .select('id')
    .single()

  if (creditErr || !creditTx) {
    await supabase.from('transactions').delete().eq('id', debitTx.id)
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return { error: `Failed to create credit transaction: ${creditErr?.message}` }
  }

  const { data: fromAcctAfter } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.from_account_id)
    .single()

  const { data: toAcctAfter } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', input.to_account_id)
    .single()

  const fromBalAfter = fromAcctAfter?.balance ?? 0
  const toBalAfter = toAcctAfter?.balance ?? 0

  const isFromBalUpdated = Math.abs(fromBalAfter - fromBalBefore) > 0.001
  const isToBalUpdated = Math.abs(toBalAfter - toBalBefore) > 0.001

  if (!isFromBalUpdated && input.from_amount !== 0) {
    const { error: fromBalErr } = await supabase.rpc('increment_account_balance', {
      p_account_id: input.from_account_id,
      p_delta: -input.from_amount,
    })

    if (fromBalErr) {
      await supabase.from('transactions').delete().in('id', [debitTx.id, creditTx.id])
      await supabase.from('transfers').delete().eq('id', transfer.id)
      return { error: 'Failed to debit source account. Transfer was not saved.' }
    }
  }

  if (!isToBalUpdated && input.to_amount !== 0) {
    const { error: toBalErr } = await supabase.rpc('increment_account_balance', {
      p_account_id: input.to_account_id,
      p_delta: input.to_amount,
    })

    if (toBalErr) {
      if (!isFromBalUpdated && input.from_amount !== 0) {
        await supabase.rpc('increment_account_balance', {
          p_account_id: input.from_account_id,
          p_delta: input.from_amount,
        })
      }
      await supabase.from('transactions').delete().in('id', [debitTx.id, creditTx.id])
      await supabase.from('transfers').delete().eq('id', transfer.id)
      return { error: 'Failed to credit destination account. Transfer was not saved.' }
    }
  }

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

  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('id, account_id, type, amount, base_currency_amount, currency, transfer_id, transfer_type')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError || !tx) {
    return { error: 'Transaction not found or access denied.' }
  }

  if (tx.type === 'transfer') {
    return {
      error:
        'Cannot delete a single transfer leg. Delete the entire transfer instead.',
    }
  }

  const { data: account } = await supabase
    .from('accounts')
    .select('balance, currency')
    .eq('id', tx.account_id)
    .single()

  const balanceBefore = account?.balance ?? 0

  const { error: delErr } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (delErr) {
    return { error: delErr.message }
  }

  const { data: acctAfter } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', tx.account_id)
    .single()

  const balanceAfter = acctAfter?.balance ?? 0
  const isBalanceUpdatedByTrigger = Math.abs(balanceAfter - balanceBefore) > 0.001

  if (!isBalanceUpdatedByTrigger && tx.amount !== 0) {
    const targetAmount = account?.currency === tx.currency ? tx.amount : tx.base_currency_amount
    const balanceDelta = tx.type === 'income' ? -targetAmount : targetAmount

    const { error: balErr } = await supabase.rpc('increment_account_balance', {
      p_account_id: tx.account_id,
      p_delta: balanceDelta,
    })

    if (balErr) {
      return {
        error:
          'Failed to update balance manually after transaction deletion. Trigger might be missing.',
      }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath(`/accounts/${tx.account_id}`)
  revalidatePath('/budgets')
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
    .maybeSingle()

  if (fetchErr || !transfer) {
    return { error: 'Transfer not found or access denied.' }
  }

  const { data: fromAcctBefore } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transfer.from_account_id)
    .single()

  const { data: toAcctBefore } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transfer.to_account_id)
    .single()

  const fromBalBefore = fromAcctBefore?.balance ?? 0
  const toBalBefore = toAcctBefore?.balance ?? 0

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

  const { data: fromAcctAfter } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transfer.from_account_id)
    .single()

  const { data: toAcctAfter } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', transfer.to_account_id)
    .single()

  const fromBalAfter = fromAcctAfter?.balance ?? 0
  const toBalAfter = toAcctAfter?.balance ?? 0

  const isFromBalUpdated = Math.abs(fromBalAfter - fromBalBefore) > 0.001
  const isToBalUpdated = Math.abs(toBalAfter - toBalBefore) > 0.001

  if (!isFromBalUpdated && transfer.from_amount !== 0) {
    await supabase.rpc('increment_account_balance', {
      p_account_id: transfer.from_account_id,
      p_delta: transfer.from_amount,
    })
  }

  if (!isToBalUpdated && transfer.to_amount !== 0) {
    await supabase.rpc('increment_account_balance', {
      p_account_id: transfer.to_account_id,
      p_delta: -transfer.to_amount,
    })
  }

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

  if (fields.full_name !== undefined && fields.full_name.trim().length === 0) {
    return { error: 'Name cannot be empty.' }
  }

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

  if (!fields.name?.trim()) return { error: 'Account name is required.' }
  if (!Number.isFinite(fields.balance)) return { error: 'Enter a valid starting balance.' }

  if (fields.balance < 0 && !accountTypeAllowsNegativeBalance(fields.type)) {
    return { error: 'Opening balance cannot be negative for this account type.' }
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...fields, name: fields.name.trim(), user_id: user.id, is_active: true })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')

  redirect(`/accounts/${data.id}`)
}

// ─── Update account ───────────────────────────────────────────────────────────

export async function updateAccount(
  accountId: string,
  fields: { name?: string; type?: string; color?: string; include_in_net_worth?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(accountId, 'Account ID')
  if (idErr) return { error: idErr }

  if (fields.name !== undefined && !fields.name.trim()) {
    return { error: 'Account name cannot be empty.' }
  }

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

// ─── Budgets ──────────────────────────────────────────────────────────────────

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

  if (!input.name?.trim()) return { error: 'Budget name is required.' }

  const amtErr = validateAmount(input.amount)
  if (amtErr) return { error: amtErr }

  const dateErr = validateDate(input.start_date)
  if (dateErr) return { error: dateErr }

  if (input.end_date) {
    const endDateErr = validateDate(input.end_date)
    if (endDateErr) return { error: endDateErr }
    if (new Date(input.end_date) < new Date(input.start_date)) {
      return { error: 'End date must be after start date.' }
    }
  }

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      ...input,
      name: input.name.trim(),
      user_id: user.id,
      is_active: true,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')

  return {
    success: true,
    id: data.id,
  }
}

export interface UpdateBudgetInput {
  name?: string
  amount?: number
  period?: 'weekly' | 'monthly' | 'yearly'
  category_id?: string | null
  end_date?: string | null
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const idErr = validateUUID(id, 'Budget ID')
  if (idErr) return { error: idErr }

  if (input.name !== undefined && !input.name.trim()) {
    return { error: 'Budget name cannot be empty.' }
  }
  if (input.amount !== undefined) {
    const amtErr = validateAmount(input.amount)
    if (amtErr) return { error: amtErr }
  }
  if (input.end_date) {
    const endDateErr = validateDate(input.end_date)
    if (endDateErr) return { error: endDateErr }
  }

  const { error } = await supabase
    .from('budgets')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/budgets')
  revalidatePath('/dashboard')
  revalidatePath(`/budgets/${id}/edit`)
  return { success: true }
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
  revalidatePath('/dashboard')

  return { success: true }
}