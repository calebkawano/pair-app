
import {
    dietarySuggestionsResponseSchema,
    type DietarySuggestionsResponse,
    type PlainDietaryPreferences,
} from '@/dto/dietarySuggestion.schema';
import { fetchJson } from './fetchJson';
import { apiRoutes } from './routes';

/**
 * Saves dietary preferences and returns AI suggestions.
 * The API expects the payload in shape: { preferences: { ... } }
 */
export async function postDietaryPreferences(
  prefs: PlainDietaryPreferences,
  opts?: { timeoutMs?: number; retries?: number },
) {
  return fetchJson<{ preferences: PlainDietaryPreferences }, DietarySuggestionsResponse>(
    apiRoutes.dietarySuggestions,
    {
      method: 'POST',
      body: { preferences: prefs },
      schema: dietarySuggestionsResponseSchema,
      toastSuccess: 'Dietary preferences saved!',
      parseJson: true,
      timeoutMs: opts?.timeoutMs,
      retries: opts?.retries,
    },
  );
} 