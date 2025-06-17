export interface GroceryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  tags: string[];
}

export const groceryItems: GroceryItem[] = [
  {
    "id": 1,
    "name": "Broccoli",
    "category": "Vegetables",
    "price": 9.94,
    "unit": "lb",
    "stock": 75,
    "tags": ["vegetables", "broccoli"]
  },
  {
    "id": 2,
    "name": "Carrot",
    "category": "Vegetables",
    "price": 1.94,
    "unit": "lb",
    "stock": 77,
    "tags": ["vegetables", "carrot"]
  },
  // ... rest of the items from your JSON
] as const;

export const categories = [
  "Vegetables",
  "Fruits",
  "Proteins",
  "Carbs",
  "Oils",
  "Seasonings",
  "Legumes",
  "Dairy"
] as const;

// Helper function to get items by category
export function getItemsByCategory(category: string): GroceryItem[] {
  return groceryItems.filter(item => item.category === category);
}

// Helper function to get item by id
export function getItemById(id: number): GroceryItem | undefined {
  return groceryItems.find(item => item.id === id);
}

// Helper function to search items by name or tags
export function searchItems(query: string): GroceryItem[] {
  const lowercaseQuery = query.toLowerCase();
  return groceryItems.filter(item => 
    item.name.toLowerCase().includes(lowercaseQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

// Helper function to get items in stock
export function getInStockItems(): GroceryItem[] {
  return groceryItems.filter(item => item.stock > 0);
}

// Helper function to get items by price range
export function getItemsByPriceRange(min: number, max: number): GroceryItem[] {
  return groceryItems.filter(item => item.price >= min && item.price <= max);
} 