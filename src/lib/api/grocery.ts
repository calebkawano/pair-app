interface UserPreferences {
  dietaryGoal: string;
  favoriteFood: string;
  cookingTime: string;
  budget: string;
  shoppingFrequency: string;
  favoriteStores: string;
  avoidStores: string;
  servingCount: string;
}

interface GroceryItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priceRange: string;
  cookingUses: string[];
  storageTips: string;
  nutritionalHighlights: string[];
}

export async function getGrocerySuggestions(preferences: UserPreferences): Promise<GroceryItem[]> {
  try {
    const response = await fetch('/api/grocery-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get grocery suggestions');
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error getting grocery suggestions:', error);
    throw error;
  }
} 