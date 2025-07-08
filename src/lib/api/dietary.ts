
import { logger } from '@/lib/logger';
import { 
  type PlainDietaryPreferences, 
  type DietarySuggestion,
  dietarySuggestionsResponseSchema 
} from '@/dto/dietarySuggestion.schema';

export async function getDietarySuggestions(preferences: PlainDietaryPreferences): Promise<DietarySuggestion[]> {
  try {
    const response = await fetch('/api/dietary-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get dietary suggestions');
    }

    const data = await response.json();
    
    // Validate the response with Zod
    const validatedData = dietarySuggestionsResponseSchema.parse(data);
    return validatedData.items;
  } catch (error) {
    logger.error('Error getting dietary suggestions:', error);
    throw error;
  }
} 