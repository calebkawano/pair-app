import { logger } from '@/lib/logger';
import { GroceryItem, StoreSection } from '@/types/grocery';

export class GroceryStoreError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'GroceryStoreError';
  }
}

// This simulates API endpoints we'd have in a real backend
class GroceryStoreService {
  private static instance: GroceryStoreService;
  private data: GroceryItem[] = [];
  private isLoaded = false;

  private constructor() {}

  static getInstance(): GroceryStoreService {
    if (!GroceryStoreService.instance) {
      GroceryStoreService.instance = new GroceryStoreService();
    }
    return GroceryStoreService.instance;
  }

  private async ensureDataLoaded(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const response = await fetch('/data/grocery_data.json');
      if (!response.ok) {
        throw new GroceryStoreError(`Failed to load grocery data: ${response.statusText}`);
      }
      this.data = await response.json();
      this.isLoaded = true;
    } catch (error) {
      logger.error('Error loading grocery data:', error);
      throw new GroceryStoreError(
        'Failed to load grocery data',
        error instanceof Error ? error.message : undefined
      );
    }
  }

  async getItems(): Promise<GroceryItem[]> {
    await this.ensureDataLoaded();
    return this.data;
  }

  async getItemsByCategory(category: StoreSection): Promise<GroceryItem[]> {
    await this.ensureDataLoaded();
    return this.data.filter(item => item.category === category);
  }

  async searchItems(query: string): Promise<GroceryItem[]> {
    await this.ensureDataLoaded();
    const lowercaseQuery = query.toLowerCase();
    return this.data.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getItemById(id: number): Promise<GroceryItem | undefined> {
    await this.ensureDataLoaded();
    return this.data.find(item => item.id === id);
  }

  async getCategories(): Promise<StoreSection[]> {
    await this.ensureDataLoaded();
    return [...new Set(this.data.map(item => item.category))] as StoreSection[];
  }

  async getInStockItems(): Promise<GroceryItem[]> {
    await this.ensureDataLoaded();
    return this.data.filter(item => item.stock && item.stock > 0);
  }

  async getItemsByPriceRange(min: number, max: number): Promise<GroceryItem[]> {
    await this.ensureDataLoaded();
    return this.data.filter(item => {
      const price = item.price ?? 0;
      return price >= min && price <= max;
    });
  }

  // Simulate price updates (in a real app, this would come from the store's API)
  async getUpdatedPrice(itemId: number): Promise<number> {
    await this.ensureDataLoaded();
    const item = await this.getItemById(itemId);
    if (!item) {
      throw new GroceryStoreError('Item not found');
    }
    if (!item.price) {
      throw new GroceryStoreError('Item has no price information');
    }
    
    // Simulate price fluctuation (±10%)
    const variation = 0.9 + Math.random() * 0.2;
    return Number((item.price * variation).toFixed(2));
  }
}

// Export a singleton instance
export const groceryStore = GroceryStoreService.getInstance(); 