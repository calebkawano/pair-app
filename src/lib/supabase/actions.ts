'use server'

import { createClient } from './server'

export async function getFoodRequests(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('food_requests')
    .select(`
      *,
      household:households(name),
      requester:profiles!food_requests_requested_by_fkey(full_name),
      approver:profiles!food_requests_approved_by_fkey(full_name)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching food requests:', error)
    throw error
  }
  return data
}

export async function getHouseholdMembers(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('household_members')
    .select(`
      *,
      household:households(
        id,
        name,
        description
      )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching household members:', error)
    throw error
  }
  return data
}

export async function createList(userId: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert([{ user_id: userId, name }])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function getLists(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateList(listId: string, updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', listId)
    .select()

  if (error) throw error
  return data[0]
}

export async function deleteList(listId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', listId)

  if (error) throw error
} 