import { GroceryItem } from '@/types/grocery';

export class PriceServiceError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'PriceServiceError';
  }
}

interface PriceComparison {
  item: GroceryItem;
  storePrices: {
    [storeName: string]: number;
  };
  bestPrice: number;
  potentialSavings: number;
}

// For now, we'll use placeholder stores until we integrate with real store APIs
const stores = ['Store A', 'Store B', 'Store C'] as const;
type Store = typeof stores[number];

// TODO: Replace with actual price fetching from database
async function getItemPrice(item: GroceryItem, store: Store): Promise<number> {
  try {
    // This is a temporary implementation
    // In the real implementation, we would:
    // 1. Query our price_tracking table for the most recent price
    // 2. If we don't have a recent price, query the store's API
    // 3. Store the new price in our database
    // 4. Return the actual price
    
    // For now, return a simulated price with some variation
    const basePrice = 5.00; // Default placeholder price
    const variation = 0.8 + Math.random() * 0.4; // Random between 0.8 and 1.2
    return Number((basePrice * variation).toFixed(2));
  } catch (error) {
    throw new PriceServiceError(
      `Failed to get price for item ${item.name} at ${store}`,
      error instanceof Error ? error.message : undefined
    );
  }
}

export async function getPriceComparison(items: GroceryItem[]): Promise<PriceComparison[]> {
  if (!items.length) {
    return [];
  }

  const comparisons: PriceComparison[] = [];
  const errors: Error[] = [];

  for (const item of items) {
    try {
      const storePrices: Record<Store, number> = {} as Record<Store, number>;
      
      // Get real prices for each store
      for (const store of stores) {
        storePrices[store] = await getItemPrice(item, store);
      }

      const prices = Object.values(storePrices);
      const bestPrice = Math.min(...prices);
      const worstPrice = Math.max(...prices);
      const potentialSavings = Number((worstPrice - bestPrice).toFixed(2));

      comparisons.push({
        item,
        storePrices,
        bestPrice,
        potentialSavings
      });
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      console.error(`Error getting price comparison for ${item.name}:`, error);
    }
  }

  if (errors.length === items.length) {
    throw new PriceServiceError('Failed to get prices for all items', { errors });
  }

  return comparisons;
}

export async function optimizeShoppingList(items: GroceryItem[]): Promise<{
  recommendedStore: Store;
  totalSavings: number;
  itemsByStore: Record<Store, GroceryItem[]>;
}> {
  if (!items.length) {
    return {
      recommendedStore: stores[0],
      totalSavings: 0,
      itemsByStore: {} as Record<Store, GroceryItem[]>
    };
  }

  const itemsByStore: Record<Store, GroceryItem[]> = {} as Record<Store, GroceryItem[]>;
  let totalSavings = 0;

  try {
    // Get price comparisons for all items
    const comparisons = await getPriceComparison(items);

    // Group items by store based on best prices
    for (const comparison of comparisons) {
      const bestStore = Object.entries(comparison.storePrices)
        .reduce((a, b) => a[1] < b[1] ? a : b)[0] as Store;
      
      if (!itemsByStore[bestStore]) {
        itemsByStore[bestStore] = [];
      }
      itemsByStore[bestStore].push(comparison.item);
      totalSavings += comparison.potentialSavings;
    }

    // Find the store with the most items
    const recommendedStore = Object.entries(itemsByStore)
      .reduce((a, b) => a[1].length > b[1].length ? a : b)[0] as Store;

    return {
      recommendedStore,
      totalSavings: Number(totalSavings.toFixed(2)),
      itemsByStore
    };
  } catch (error) {
    throw new PriceServiceError(
      'Failed to optimize shopping list',
      error instanceof Error ? error.message : undefined
    );
  }
}

// Get optimal shopping route within a store
export function getOptimalRoute(items: GroceryItem[]): GroceryItem[] {
  if (!items.length) {
    return [];
  }

  // Define the optimal section order (temperature and weight considerations)
  const sectionOrder = [
    "Pantry",     // Non-perishable
    "Household",  // Non-perishable
    "Carbs",      // Non-perishable, often heavy
    "Snacks",     // Non-perishable
    "Beverages",  // Non-perishable
    "Vegetables", // Fresh but sturdy
    "Fruits",     // Fresh but delicate
    "Proteins",   // Temperature sensitive
    "Dairy",      // Temperature sensitive
    "Frozen"      // Most temperature sensitive
  ] as const;

  type Section = typeof sectionOrder[number] | 'Other';

  // Sort items based on section order
  return [...items].sort((a, b) => {
    const aSection = (a.section || 'Other') as Section;
    const bSection = (b.section || 'Other') as Section;
    const aIndex = sectionOrder.indexOf(aSection as typeof sectionOrder[number]);
    const bIndex = sectionOrder.indexOf(bSection as typeof sectionOrder[number]);
    return (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex);
  });
} 