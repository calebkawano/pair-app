
import {
  type PlainShoppingSettings,
  type ShoppingRecommendations,
  shoppingRecommendationsSchema,
} from '@/dto/shoppingSettings.schema';
import { fetchJson } from './fetchJson';
import { apiRoutes } from './routes';

export async function postShoppingSuggestions(
  req: PlainShoppingSettings,
): Promise<ShoppingRecommendations> {
  return fetchJson<{ preferences: PlainShoppingSettings }, ShoppingRecommendations>(
    apiRoutes.shoppingSuggestions,
    {
      body: { preferences: req },
      schema: shoppingRecommendationsSchema,
      toastError: 'Failed to get shopping suggestions',
    },
  );
} 