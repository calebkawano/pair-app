export interface GroceryItem {
  id: string;
  name?: string;
  item_name?: string;
  category: string;
  quantity: number;
  unit: string | null;
  price?: number;
  stock?: number;
  tags?: string[];
  priority?: 'urgent' | 'normal';
  section?: string | null;
  household: {
    name: string;
    color?: string;
  };
  requester: {
    full_name: string;
  };
  approver?: {
    full_name: string;
  } | null;
  is_purchased?: boolean;
  is_accepted?: boolean;
  status?: 'pending' | 'approved' | 'declined';
  item_description?: string | null;
  cookingUses?: string[];
  storageTips?: string;
  nutritionalHighlights?: string[];
  created_at?: string;
  created_from_groceries?: boolean;
}

export interface UserPreferences {
  dietaryGoal: string;
  favoriteFood: string;
  cookingTime: string;
  budget: string;
  shoppingFrequency: string;
  favoriteStores: string;
  avoidStores: string;
  servingCount: string;
}

export type StoreSection = 'Produce' | 'Meat' | 'Seafood' | 'Dairy & Eggs' | 'Bakery' | 'Pantry' | 'Frozen' | 'Beverages' | 'Household' | 'Other';

export const UNITS = [
  'pcs',
  'lbs',
  'oz',
  'kg',
  'g',
  'cups',
  'tbsp',
  'tsp',
  'bottles',
  'cans',
  'boxes',
  'bags',
  'loaves'
] as const;

export type Unit = typeof UNITS[number];

export const PRIORITY_LEVELS = ['normal', 'urgent'] as const;
export type Priority = typeof PRIORITY_LEVELS[number]; 