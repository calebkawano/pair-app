export interface GroceryItem {
  id: string;
  name: string;
  store: string;
  isChecked: boolean;
  quantity?: string;
  notes?: string;
}

export interface SmartSummary {
  stores: string[];
  totalItems: number;
  estimatedTime: string;
  estimatedSavings: string;
}

export const dummyGroceryList: GroceryItem[] = [
  {
    id: "1",
    name: "Chicken Breast",
    store: "Costco",
    isChecked: false,
    quantity: "2 packs"
  },
  {
    id: "2",
    name: "Greek Yogurt",
    store: "Trader Joe's",
    isChecked: false,
    quantity: "32 oz"
  },
  {
    id: "3",
    name: "Sweet Potatoes",
    store: "Trader Joe's",
    isChecked: false,
    quantity: "3 lbs"
  },
  {
    id: "4",
    name: "Quinoa",
    store: "Costco",
    isChecked: false,
    quantity: "1 bag"
  },
  {
    id: "5",
    name: "Spinach",
    store: "Trader Joe's",
    isChecked: false,
    quantity: "2 bags"
  }
];

export const dummySmartSummary: SmartSummary = {
  stores: ["Costco", "Trader Joe's"],
  totalItems: 5,
  estimatedTime: "45 minutes",
  estimatedSavings: "$23.50"
}; 