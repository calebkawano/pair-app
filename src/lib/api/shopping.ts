interface ShoppingPreferences {
  budget: string;
  shoppingFrequency: string;
  favoriteStores: string;
  avoidStores: string;
}

interface ShoppingRecommendations {
  budgetBreakdown: {
    category: string;
    suggestedAmount: number;
    percentage: number;
  }[];
  shoppingTips: string[];
  storeRecommendations: {
    store: string;
    reason: string;
    categories: string[];
  }[];
  schedulingAdvice: string;
}

export async function getShoppingSuggestions(preferences: ShoppingPreferences): Promise<ShoppingRecommendations> {
  try {
    const response = await fetch('/api/shopping-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      throw new Error('Failed to get shopping suggestions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting shopping suggestions:', error);
    throw error;
  }
} 