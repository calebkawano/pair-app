import { FlexValue } from '@/components/FlexInput';
import { createClient } from '@/lib/supabase/client';

export interface ShoppingPreferencesData {
  budget: FlexValue;
  shoppingFrequency: FlexValue;
  favoriteStores: FlexValue;
  avoidStores: FlexValue;
}

export async function saveShoppingPreferences(userId: string, preferences: ShoppingPreferencesData): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('household_members')
    .update({ 
      shopping_preferences: preferences 
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to save shopping preferences: ${error.message}`);
  }
} 