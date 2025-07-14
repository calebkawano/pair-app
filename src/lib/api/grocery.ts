import type { UserPreferences } from '@/types/grocery';
import { z } from 'zod';
import { postJson } from './post-json';
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

/**
 * Generates AI-powered grocery suggestions based on user preferences.
 */
export const postGrocerySuggestions = postJson<
  UserPreferences,
  GrocerySuggestionsResponse
>(
  apiRoutes.grocerySuggestions,
  grocerySuggestionsResponseSchema,
  'Grocery preferences saved!',
); 