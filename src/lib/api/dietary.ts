
import {
  dietarySuggestionsResponseSchema,
  type DietarySuggestionsResponse,
  type PlainDietaryPreferences
} from '@/dto/dietarySuggestion.schema';
import { fetchJson } from './fetchJson';
import { apiRoutes } from './routes';

export async function postDietaryPreferences(
  req: PlainDietaryPreferences,
): Promise<DietarySuggestionsResponse> {
  return fetchJson<PlainDietaryPreferences, DietarySuggestionsResponse>(
    apiRoutes.dietarySuggestions,
    {
      body: req,
      schema: dietarySuggestionsResponseSchema,
      toastError: 'Failed to get dietary suggestions',
    },
  );
} 