
import {
    type PlainShoppingSettings,
    type ShoppingRecommendations,
    shoppingRecommendationsSchema,
} from '@/dto/shoppingSettings.schema';
import { postJson } from './post-json';
import { apiRoutes } from './routes';

/**
 * Fetches personalised shopping recommendations.
 * Wraps the payload in a { preferences } object to align with API contract.
 */
export const postShoppingSuggestions = (
  preferences: PlainShoppingSettings,
  opts?: { timeoutMs?: number; retries?: number },
) =>
  postJson<{ preferences: PlainShoppingSettings }, ShoppingRecommendations>(
    apiRoutes.shoppingSuggestions,
    shoppingRecommendationsSchema,
    'Shopping settings saved!',
  )({ preferences }, opts); 