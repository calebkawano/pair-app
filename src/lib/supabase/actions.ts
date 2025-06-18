'use server'

import { createClient } from './server'

export async function getFoodRequests(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('food_requests')
    .select(`
      *,
      household:households(name, color),
      requester:profiles!food_requests_requested_by_fkey(full_name),
      approver:profiles!food_requests_approved_by_fkey(full_name)
    `)
    .in('status', ['approved', 'pending'])
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

export async function createAIFoodRequests(userId: string, items: any[]) {
  const supabase = await createClient();
  
  // Transform AI suggestions into food requests
  const foodRequests = items.map(item => ({
    user_id: userId,
    item_name: item.name,
    item_description: `${item.cooking_versatility}\n\nStorage: ${item.storage_tips}\n\nNutrition: ${item.nutritional_highlights}`,
    quantity: item.quantity,
    unit: item.unit,
    section: item.category,
    priority: 'normal',
    status: 'pending',
    requested_by: userId,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('food_requests')
    .insert(foodRequests)
    .select();

  if (error) {
    console.error('Error creating AI food requests:', error);
    throw error;
  }

  return data;
}

export async function getRecentMeals(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recent_meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching recent meals:', error)
    throw error
  }
  return data
}

export async function createRecentMeal(userId: string, mealData: any) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recent_meals')
    .insert([{
      user_id: userId,
      ...mealData,
      created_from_groceries: true
    }])
    .select()

  if (error) {
    console.error('Error creating recent meal:', error)
    throw error
  }
  return data[0]
} 