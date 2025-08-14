export interface DietaryTag {
  label: string;
  color: string; // Tailwind color class
  icon: string; // emoji
}

export interface Meal {
  id: string;
  name: string;
  category: 'high-protein' | 'vegetarian' | 'vegan' | 'keto' | 'snack' | 'treat' | 'random';
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

export interface MealCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  meals: Meal[];
}

export interface CarouselSection {
  id: string;
  title: string;
  subtitle: string;
  categories: MealCategory[];
}


