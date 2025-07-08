'use server'

import { logger } from '@/lib/logger';
import { FoodRequest, HouseholdMember } from '@/types/database';
import { createClient, SupabaseError } from './server';

export async function getFoodRequests(userId: string): Promise<FoodRequest[]> {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

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
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    logger.error('Error fetching food requests:', error)
    throw new SupabaseError('Failed to fetch food requests', error.code, error.message)
  }
  
  return data as FoodRequest[]
}

export async function getHouseholdMembers(userId: string): Promise<HouseholdMember[]> {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('household_members')
    .select(`
      *,
      household:households(
        id,
        name,
        color
      )
    `)
    .eq('user_id', userId)

  if (error) {
    logger.error('Error fetching household members:', error)
    throw new SupabaseError('Failed to fetch household members', error.code, error.message)
  }
  
  return data as HouseholdMember[]
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

export async function createAIFoodRequests(
  userId: string, 
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    cooking_versatility?: string;
    storage_tips?: string;
    nutritional_highlights?: string[];
  }>
): Promise<FoodRequest[]> {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

  if (!items || items.length === 0) {
    throw new SupabaseError('Items array is required and cannot be empty');
  }

  const supabase = await createClient();
  
  // Get user's default household
  const { data: householdMembers, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(1);

  if (memberError || !householdMembers?.length) {
    throw new SupabaseError('User must be a member of at least one household');
  }

  // Transform AI suggestions into food requests
  const foodRequests = items.map(item => ({
    household_id: householdMembers[0].household_id,
    requested_by: userId,
    item_name: item.name,
    item_description: [
      item.cooking_versatility && `Cooking: ${item.cooking_versatility}`,
      item.storage_tips && `Storage: ${item.storage_tips}`,
      item.nutritional_highlights?.length && `Nutrition: ${item.nutritional_highlights.join(', ')}`
    ].filter(Boolean).join('\n\n') || null,
    quantity: item.quantity,
    unit: item.unit,
    section: item.category,
    priority: 'normal' as const,
    status: 'approved' as const, // Auto-approve AI suggestions
    is_manual: false,
  }));

  const { data, error } = await supabase
    .from('food_requests')
    .insert(foodRequests)
    .select();

  if (error) {
    logger.error('Error creating AI food requests:', error);
    throw new SupabaseError('Failed to create AI food requests', error.code, error.message);
  }

  return data as FoodRequest[];
}

export async function getRecentMeals(userId: string) {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recent_meals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    logger.error('Error fetching recent meals:', error)
    throw new SupabaseError('Failed to fetch recent meals', error.code, error.message)
  }
  
  return data
}

export async function createRecentMeal(userId: string, mealData: any) {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

  if (!mealData || !mealData.meal_name) {
    throw new SupabaseError('Meal data with meal_name is required');
  }

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
    logger.error('Error creating recent meal:', error)
    throw new SupabaseError('Failed to create recent meal', error.code, error.message)
  }
  
  return data[0]
}

export async function getShoppingItemCount(userId: string): Promise<number> {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

  const supabase = await createClient();
  
  // Get all households for the user
  const { data: householdMembers, error: memberError } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userId);

  if (memberError) {
    logger.error('Error fetching household members:', memberError);
    throw new SupabaseError('Failed to fetch household members', memberError.code, memberError.message);
  }

  const householdIds = householdMembers?.map(member => member.household_id) || [];

  if (householdIds.length === 0) {
    return 0;
  }

  // Get count of unpurchased items (approved) from all household lists
  const { count, error: countError } = await supabase
    .from('food_requests')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved'])
    .eq('is_purchased', false)
    .is('deleted_at', null)
    .in('household_id', householdIds);

  if (countError) {
    logger.error('Error counting list items:', countError);
    throw new SupabaseError('Failed to count shopping items', countError.code, countError.message);
  }

  return count || 0;
}

export async function softDeleteFoodRequest(requestId: number, userId: string): Promise<void> {
  if (!requestId || !userId) {
    throw new SupabaseError('Request ID and User ID are required');
  }

  const supabase = await createClient();
  
  const { error } = await supabase
    .from('food_requests')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', requestId)
    .eq('requested_by', userId); // Only allow users to delete their own requests

  if (error) {
    logger.error('Error soft deleting food request:', error);
    throw new SupabaseError('Failed to delete food request', error.code, error.message);
  }
}

export async function saveShoppingPreferences(userId: string, prefs: Record<string, unknown>): Promise<void> {
  if (!userId) {
    throw new SupabaseError('User ID is required');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('household_members')
    .update({ shopping_preferences: prefs })
    .eq('user_id', userId);

  if (error) {
    logger.error('Error saving shopping preferences:', error);
    throw new SupabaseError('Failed to save shopping preferences', error.code, error.message);
  }
} 