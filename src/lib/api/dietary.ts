interface DietaryPreferences {
  dietaryGoal: string;
  favoriteFood: string;
  cookingTime: string;
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

export async function getDietarySuggestions(preferences: DietaryPreferences): Promise<GroceryItem[]> {
  try {
    const response = await fetch('/api/dietary-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get dietary suggestions');
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error getting dietary suggestions:', error);
    throw error;
  }
} 