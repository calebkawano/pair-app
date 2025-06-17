interface GroceryItem {
  id: number;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit: string | null;
  priority: 'urgent' | 'normal';
  section?: string | null;
  household: {
    name: string;
  };
  requester: {
    full_name: string;
  };
  approver: {
    full_name: string;
  } | null;
  is_purchased?: boolean;
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

// TODO: Replace with actual price fetching from database
async function getItemPrice(item: GroceryItem, store: string): Promise<number> {
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
}

export async function getPriceComparison(items: GroceryItem[]): Promise<PriceComparison[]> {
  const comparisons: PriceComparison[] = [];

  for (const item of items) {
    const storePrices: Record<string, number> = {};
    
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
  }

  return comparisons;
}

export async function optimizeShoppingList(items: GroceryItem[]): Promise<{
  recommendedStore: string;
  totalSavings: number;
  itemsByStore: Record<string, GroceryItem[]>;
}> {
  const itemsByStore: Record<string, GroceryItem[]> = {};
  let totalSavings = 0;

  // Get price comparisons for all items
  const comparisons = await getPriceComparison(items);

  // Group items by store based on best prices
  for (const comparison of comparisons) {
    const bestStore = Object.entries(comparison.storePrices)
      .reduce((a, b) => a[1] < b[1] ? a : b)[0];
    
    if (!itemsByStore[bestStore]) {
      itemsByStore[bestStore] = [];
    }
    itemsByStore[bestStore].push(comparison.item);
    totalSavings += comparison.potentialSavings;
  }

  // Find the store with the most items
  const recommendedStore = Object.entries(itemsByStore)
    .reduce((a, b) => a[1].length > b[1].length ? a : b)[0];

  return {
    recommendedStore,
    totalSavings: Number(totalSavings.toFixed(2)),
    itemsByStore
  };
}

// Get optimal shopping route within a store
export function getOptimalRoute(items: GroceryItem[]): GroceryItem[] {
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
  ];

  // Sort items based on section order
  return [...items].sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a.section || 'Other');
    const bIndex = sectionOrder.indexOf(b.section || 'Other');
    return aIndex - bIndex;
  });
} 