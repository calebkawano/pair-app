import { z } from 'zod';

// Shopping form data schema (with FlexValue)
export const shoppingFormDataSchema = z.object({
  budget: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  }),
  shoppingFrequency: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  }),
  favoriteStores: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  }),
  avoidStores: z.object({
    type: z.enum(['dropdown', 'text']),
    value: z.string()
  })
});

// Plain shopping settings for API/storage
export const plainShoppingSettingsSchema = z.object({
  budget: z.string(),
  shoppingFrequency: z.string(),
  favoriteStores: z.string(),
  avoidStores: z.string()
});

// Budget breakdown item schema
export const budgetBreakdownItemSchema = z.object({
  category: z.string(),
  suggestedAmount: z.number(),
  percentage: z.number()
});

// Store recommendation schema
export const storeRecommendationSchema = z.object({
  store: z.string(),
  reason: z.string(),
  categories: z.array(z.string())
});

// Shopping recommendations schema
export const shoppingRecommendationsSchema = z.object({
  budgetBreakdown: z.array(budgetBreakdownItemSchema),
  shoppingTips: z.array(z.string()),
  storeRecommendations: z.array(storeRecommendationSchema),
  schedulingAdvice: z.string()
});

// Type exports
export type ShoppingFormData = z.infer<typeof shoppingFormDataSchema>;
export type PlainShoppingSettings = z.infer<typeof plainShoppingSettingsSchema>;
export type BudgetBreakdownItem = z.infer<typeof budgetBreakdownItemSchema>;
export type StoreRecommendation = z.infer<typeof storeRecommendationSchema>;
export type ShoppingRecommendations = z.infer<typeof shoppingRecommendationsSchema>; 