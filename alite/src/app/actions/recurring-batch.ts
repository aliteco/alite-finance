// filepath: alite/src/app/actions/recurring-batch.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateRecurringNow } from '@/app/actions/recurring'

export interface BatchResult {
  processed: number
  failed: number
  errors: string[]
}

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

// Generates a transaction for every active, overdue recurring rule owned by
// the current user. Used by the "Catch up overdue" bulk action on /recurring.
// Each rule still goes through generateRecurringNow so the same balance
// and rate logic is reused — no duplicated business logic.
export async function generateAllOverdueRecurring(): Promise<BatchResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  const today = new Date().toISOString().slice(0, 10)

  const { data: overdueRules, error } = await supabase
    .from('recurring_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .lte('next_due_date', today)

  if (error) {
    return { processed: 0, failed: 0, errors: [error.message] }
  }

  const rules = overdueRules ?? []
  let processed = 0
  let failed = 0
  const errors: string[] = []

  for (const rule of rules) {
    const result = await generateRecurringNow(rule.id)
    if (result.error) {
      failed += 1
      errors.push(result.error)
    } else {
      processed += 1
    }
  }

  revalidatePath('/recurring')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')

  return { processed, failed, errors }
}