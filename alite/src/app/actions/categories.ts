'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface ActionResult {
  error?: string
  success?: boolean
  id?: string
}

function assertUser(user: { id: string } | null): asserts user is { id: string } {
  if (!user) throw new Error('Unauthenticated')
}

export interface CreateCategoryInput {
  name: string
  icon: string
  color: string
  type: 'income' | 'expense' | 'both'
}

export async function createCategory(input: CreateCategoryInput): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  if (!input.name.trim()) return { error: 'Category name is required.' }
  if (!['income', 'expense', 'both'].includes(input.type)) return { error: 'Invalid category type.' }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      icon: input.icon || '🏷️',
      color: input.color || '#6366f1',
      type: input.type,
      is_system: false,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/settings/categories')
  return { success: true, id: data.id }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  assertUser(user)

  // Only allow deleting categories the user owns (never system categories,
  // enforced by the user_id filter — RLS should mirror this).
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_system', false)

  if (error) {
    return {
      error: error.message.includes('foreign key')
        ? 'This category is used by existing transactions or budgets and cannot be deleted.'
        : error.message,
    }
  }

  revalidatePath('/settings/categories')
  return { success: true }
}