'use server'

import { createClient } from './server'

export async function createList(userId: string, name: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert([{ user_id: userId, name }])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function getLists(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateList(listId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', listId)
    .select()

  if (error) throw error
  return data[0]
}

export async function deleteList(listId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', listId)

  if (error) throw error
} 