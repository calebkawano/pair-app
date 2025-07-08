import { z } from 'zod';

// Dietary preferences schema (for form data and storage)
export const dietaryPreferencesSchema = z.object({
  dietaryGoal: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  }),
  favoriteFood: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  }),
  cookingTime: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  }),
  servingCount: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  })
});

// Plain dietary preferences for API calls (now optional)
export const plainDietaryPreferencesSchema = z.object({
  dietaryGoal: z.string().optional(),
  favoriteFood: z.string().optional(),
  cookingTime: z.string().optional(),
  servingCount: z.string().optional()
});

// Dietary suggestion item schema (from API response)
export const dietarySuggestionSchema = z.object({
  name: z.string(),
  category: z.string(),
  quantity: z.number(),
  unit: z.string(),
  priceRange: z.string(),
  cookingUses: z.array(z.string()),
  storageTips: z.string(),
  nutritionalHighlights: z.array(z.string())
});

// Array of dietary suggestions
export const dietarySuggestionsResponseSchema = z.object({
  items: z.array(dietarySuggestionSchema)
});

// Type exports
export type DietaryPreferences = z.infer<typeof dietaryPreferencesSchema>;
export type PlainDietaryPreferences = z.infer<typeof plainDietaryPreferencesSchema>;
export type DietarySuggestion = z.infer<typeof dietarySuggestionSchema>;
export type DietarySuggestionsResponse = z.infer<typeof dietarySuggestionsResponseSchema>; 