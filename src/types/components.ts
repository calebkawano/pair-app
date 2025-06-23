import { GroceryItem } from './grocery';

export interface GroceryListProps {
  items: GroceryItem[];
  onToggleItem: (id: number) => void;
  showCategories?: boolean;
  showQuantities?: boolean;
  showPriorities?: boolean;
}

export interface SmartShoppingSummaryProps {
  items: GroceryItem[];
  onOptimizationComplete?: (optimization: ShoppingOptimization | null) => void;
}

export interface ShoppingOptimization {
  recommendedStore: string;
  totalSavings: number;
  itemsByStore: Record<string, GroceryItem[]>;
  optimalRoute: GroceryItem[];
}

export interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
  defaultHouseholdId?: number;
  defaultPriority?: 'normal' | 'urgent';
  defaultSection?: string;
}

export interface SmartSummaryProps {
  summary: {
    stores: string[];
    estimatedTime: string;
    estimatedSavings: string;
    routeSections: string[];
    totalItems: number;
    heavyItems: number;
    temperatureSensitive: number;
  };
} 