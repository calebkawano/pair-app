import { GroceryItem, UserPreferences } from '@/types/grocery';

export class GroceryApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'GroceryApiError';
  }
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
      const errorData = await response.json().catch(() => ({}));
      throw new GroceryApiError(
        errorData.error || 'Failed to get grocery suggestions',
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    if (error instanceof GroceryApiError) {
      throw error;
    }
    console.error('Error getting grocery suggestions:', error);
    throw new GroceryApiError(
      error instanceof Error ? error.message : 'Failed to get grocery suggestions'
    );
  }
} 