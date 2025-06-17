export interface GroceryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  tags: string[];
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

  async loadData(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const response = await fetch('/data/grocery_data.json');
      if (!response.ok) throw new Error('Failed to load grocery data');
      this.data = await response.json();
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading grocery data:', error);
      throw error;
    }
  }

  async getItems(): Promise<GroceryItem[]> {
    await this.loadData();
    return this.data;
  }

  async getItemsByCategory(category: string): Promise<GroceryItem[]> {
    await this.loadData();
    return this.data.filter(item => item.category === category);
  }

  async searchItems(query: string): Promise<GroceryItem[]> {
    await this.loadData();
    const lowercaseQuery = query.toLowerCase();
    return this.data.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getItemById(id: number): Promise<GroceryItem | undefined> {
    await this.loadData();
    return this.data.find(item => item.id === id);
  }

  async getCategories(): Promise<string[]> {
    await this.loadData();
    return [...new Set(this.data.map(item => item.category))];
  }

  async getInStockItems(): Promise<GroceryItem[]> {
    await this.loadData();
    return this.data.filter(item => item.stock > 0);
  }

  async getItemsByPriceRange(min: number, max: number): Promise<GroceryItem[]> {
    await this.loadData();
    return this.data.filter(item => item.price >= min && item.price <= max);
  }

  // Simulate price updates (in a real app, this would come from the store's API)
  async getUpdatedPrice(itemId: number): Promise<number> {
    await this.loadData();
    const item = await this.getItemById(itemId);
    if (!item) throw new Error('Item not found');
    
    // Simulate price fluctuation (±10%)
    const variation = 0.9 + Math.random() * 0.2;
    return Number((item.price * variation).toFixed(2));
  }
}

// Export a singleton instance
export const groceryStore = GroceryStoreService.getInstance(); 