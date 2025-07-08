
import {
    type PlainShoppingSettings,
    type ShoppingRecommendations,
    shoppingRecommendationsSchema
} from '@/dto/shoppingSettings.schema';
import { logger } from '@/lib/logger';

export async function getShoppingSuggestions(preferences: PlainShoppingSettings): Promise<ShoppingRecommendations> {
  try {
    const response = await fetch('/api/shopping-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get shopping suggestions');
    }

    const data = await response.json();
    
    // Validate the response with Zod
    const validatedData = shoppingRecommendationsSchema.parse(data);
    return validatedData;
  } catch (error) {
    logger.error('Error getting shopping suggestions:', error);
    throw error;
  }
} 