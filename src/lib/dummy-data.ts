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

export interface DietaryTag {
  label: string;
  color: string; // Tailwind color class
  icon: string; // emoji
}

export interface Meal {
  id: string;
  name: string;
  category: 'high-protein' | 'vegetarian' | 'vegan' | 'snack' | 'treat' | 'random';
  cookingTime: string;
  rating: number;
  dietaryTags: string[]; // References to dietary tags
  ingredients: string[];
  steps: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  imageUrl?: string;
}

export const dietaryTags: Record<string, DietaryTag> = {
  vegan: {
    label: 'Vegan',
    color: 'text-green-600',
    icon: '🌱'
  },
  vegetarian: {
    label: 'Vegetarian',
    color: 'text-emerald-600',
    icon: '🥬'
  },
  highProtein: {
    label: 'High Protein',
    color: 'text-red-600',
    icon: '💪'
  },
  glutenFree: {
    label: 'Gluten Free',
    color: 'text-yellow-600',
    icon: '🌾'
  },
  dairyFree: {
    label: 'Dairy Free',
    color: 'text-blue-600',
    icon: '🥛'
  }
};

export const quickMealCategories = [
  {
    id: 'high-protein',
    name: 'High Protein',
    icon: '💪',
    color: 'bg-red-100 hover:bg-red-200',
    textColor: 'text-red-700'
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    icon: '🥬',
    color: 'bg-emerald-100 hover:bg-emerald-200',
    textColor: 'text-emerald-700'
  },
  {
    id: 'vegan',
    name: 'Vegan',
    icon: '🌱',
    color: 'bg-green-100 hover:bg-green-200',
    textColor: 'text-green-700'
  },
  {
    id: 'snack',
    name: 'Snack',
    icon: '🍿',
    color: 'bg-yellow-100 hover:bg-yellow-200',
    textColor: 'text-yellow-700'
  },
  {
    id: 'treat',
    name: 'Treat',
    icon: '🍪',
    color: 'bg-purple-100 hover:bg-purple-200',
    textColor: 'text-purple-700'
  },
  {
    id: 'random',
    name: 'Try Something New',
    icon: '🎲',
    color: 'bg-blue-100 hover:bg-blue-200',
    textColor: 'text-blue-700'
  }
];

export const dummyMeals: Meal[] = [
  {
    id: '1',
    name: 'Protein-Packed Quinoa Bowl',
    category: 'high-protein',
    cookingTime: '25 mins',
    rating: 4.5,
    dietaryTags: ['highProtein', 'glutenFree'],
    ingredients: [
      'Quinoa',
      'Grilled chicken breast',
      'Black beans',
      'Sweet corn',
      'Cherry tomatoes',
      'Avocado',
      'Lime juice'
    ],
    steps: [
      'Cook quinoa according to package instructions',
      'Grill seasoned chicken breast for 6-8 minutes per side',
      'Combine all ingredients in a bowl',
      'Drizzle with lime juice and serve'
    ],
    nutrition: {
      calories: 450,
      protein: 35,
      carbs: 48,
      fat: 15,
      fiber: 12
    },
    imageUrl: 'https://images.unsplash.com/photo-1543352634-99a5d50ae78e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '2',
    name: 'Buddha Bowl',
    category: 'vegan',
    cookingTime: '20 mins',
    rating: 4.8,
    dietaryTags: ['vegan', 'glutenFree'],
    ingredients: [
      'Brown rice',
      'Chickpeas',
      'Sweet potato',
      'Kale',
      'Tahini',
      'Lemon juice'
    ],
    steps: [
      'Cook brown rice',
      'Roast sweet potato chunks',
      'Massage kale with lemon juice',
      'Combine ingredients and drizzle with tahini'
    ],
    nutrition: {
      calories: 380,
      protein: 15,
      carbs: 62,
      fat: 10,
      fiber: 14
    },
    imageUrl: 'https://images.unsplash.com/photo-1546007600-8c4e21a5c6d8?auto=format&fit=crop&w=800&q=80'
  }
];

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