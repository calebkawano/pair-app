
import {
    dietarySuggestionsResponseSchema,
    type DietarySuggestionsResponse,
    type PlainDietaryPreferences,
} from '@/dto/dietarySuggestion.schema';
import { postJson } from './post-json';
import { apiRoutes } from './routes';

/**
 * Saves dietary preferences and returns AI suggestions.
 */
export const postDietaryPreferences = postJson<
  PlainDietaryPreferences,
  DietarySuggestionsResponse
>(
  apiRoutes.dietarySuggestions,
  dietarySuggestionsResponseSchema,
  'Dietary preferences saved!',
); 