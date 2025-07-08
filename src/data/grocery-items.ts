// Static grocery data with basic structure
interface BasicGroceryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  tags: string[];
}

export const groceryItems: BasicGroceryItem[] = [
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

// Helper function to get item by id
export function getItemById(id: number): BasicGroceryItem | undefined {
  return groceryItems.find(item => item.id === id);
} 