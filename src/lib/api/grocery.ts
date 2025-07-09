import type { UserPreferences } from '@/types/grocery';
import { z } from 'zod';
import { fetchJson } from './fetchJson';
import { apiRoutes } from './routes';

// Minimal Grocery suggestion schema - refine once backend contract stabilises
const grocerySuggestionSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().nullable().optional(),
});

const grocerySuggestionsResponseSchema = z.object({
  items: z.array(grocerySuggestionSchema),
});

export type GrocerySuggestion = z.infer<typeof grocerySuggestionSchema>;
export type GrocerySuggestionsResponse = z.infer<typeof grocerySuggestionsResponseSchema>;

export async function postGrocerySuggestions(
  req: UserPreferences,
): Promise<GrocerySuggestionsResponse> {
  return fetchJson<UserPreferences, GrocerySuggestionsResponse>(
    apiRoutes.grocerySuggestions,
    {
      body: req,
      schema: grocerySuggestionsResponseSchema,
      toastError: 'Failed to get grocery suggestions',
    },
  );
} 