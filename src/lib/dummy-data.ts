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
  },
  keto: {
    label: 'Keto',
    color: 'text-purple-600',
    icon: '🥑'
  },
  paleo: {
    label: 'Paleo',
    color: 'text-orange-600',
    icon: '🥩'
  },
  mediterranean: {
    label: 'Mediterranean',
    color: 'text-blue-500',
    icon: '🫒'
  },
  lowCarb: {
    label: 'Low Carb',
    color: 'text-indigo-600',
    icon: '🥒'
  },
  antiInflammatory: {
    label: 'Anti-Inflammatory',
    color: 'text-pink-600',
    icon: '🫐'
  },
  heartHealthy: {
    label: 'Heart Healthy',
    color: 'text-red-500',
    icon: '❤️'
  },
  weightLoss: {
    label: 'Weight Loss',
    color: 'text-green-500',
    icon: '⚖️'
  },
  muscleBuilding: {
    label: 'Muscle Building',
    color: 'text-red-600',
    icon: '💪'
  },
  smoothies: {
    label: 'Smoothies',
    color: 'text-purple-500',
    icon: '🥤'
  },
  whole30: {
    label: 'Whole30',
    color: 'text-amber-600',
    icon: '🌿'
  }
};

// Diet-based meal categories with images
export const dietBasedCategories: MealCategory[] = [
  {
    id: 'high-protein',
    name: 'High Protein',
    description: 'Power up with protein-rich meals',
    imageUrl: '/images/categories/diet/high-protein.png',
    meals: [] // Will be populated with actual meals
  },
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'Plant-based goodness',
    imageUrl: '/images/categories/diet/vegan.png',
    meals: []
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'Meat-free delicious options',
    imageUrl: '/images/categories/diet/vegetarian.png',
    meals: []
  },
  {
    id: 'keto',
    name: 'Keto',
    description: 'Low-carb, high-fat favorites',
    imageUrl: '/images/categories/diet/keto.png',
    meals: []
  },
  {
    id: 'paleo',
    name: 'Paleo',
    description: 'Natural, unprocessed eating',
    imageUrl: '/images/categories/diet/paleo.png',
    meals: []
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Heart-healthy coastal cuisine',
    imageUrl: '/images/categories/diet/mediterranean.png',
    meals: []
  },
  {
    id: 'low-carb',
    name: 'Low Carb',
    description: 'Satisfying without the carbs',
    imageUrl: '/images/categories/diet/low-carb.png',
    meals: []
  },
  {
    id: 'gluten-free',
    name: 'Gluten-Free',
    description: 'Safe and delicious options',
    imageUrl: '/images/categories/diet/gluten-free.png',
    meals: []
  },
  {
    id: 'anti-inflammatory',
    name: 'Anti-Inflammatory',
    description: 'Foods that heal and nourish',
    imageUrl: '/images/categories/diet/anti-inflammatory.png',
    meals: []
  },
  {
    id: 'heart-healthy',
    name: 'Heart Healthy',
    description: 'Good for your heart',
    imageUrl: '/images/categories/diet/heart-healthy.png',
    meals: []
  },
  {
    id: 'weight-loss',
    name: 'Weight Loss',
    description: 'Light and satisfying meals',
    imageUrl: '/images/categories/diet/weight-loss.png',
    meals: []
  },
  {
    id: 'muscle-building',
    name: 'Muscle Building',
    description: 'Fuel your gains',
    imageUrl: '/images/categories/diet/muscle-building.png',
    meals: []
  },
  {
    id: 'smoothies',
    name: 'Smoothies',
    description: 'Blend your way to health',
    imageUrl: '/images/categories/diet/smoothies.png',
    meals: []
  },
  {
    id: 'whole30',
    name: 'Whole30',
    description: 'Clean eating made simple',
    imageUrl: '/images/categories/diet/whole30.png',
    meals: []
  }
];

// Cuisine-based meal categories with images
export const cuisineCategories: MealCategory[] = [
  {
    id: 'mexican',
    name: 'Mexican',
    description: 'Tacos, burritos, and more',
    imageUrl: '/images/categories/cuisine/mexican.png',
    meals: []
  },
  {
    id: 'chinese',
    name: 'Chinese',
    description: 'Wok-fired classics',
    imageUrl: '/images/categories/cuisine/chinese.png',
    meals: []
  },
  {
    id: 'indian',
    name: 'Indian',
    description: 'Rich curries and spices',
    imageUrl: '/images/categories/cuisine/indian.png',
    meals: []
  },
  {
    id: 'italian',
    name: 'Italian',
    description: 'Pasta, pizza, and amore',
    imageUrl: '/images/categories/cuisine/italian.png',
    meals: []
  },
  {
    id: 'japanese',
    name: 'Japanese',
    description: 'Sushi, ramen, and more',
    imageUrl: '/images/categories/cuisine/japanese.png',
    meals: []
  },
  {
    id: 'thai',
    name: 'Thai',
    description: 'Sweet, sour, spicy harmony',
    imageUrl: '/images/categories/cuisine/thai.png',
    meals: []
  },
  {
    id: 'greek',
    name: 'Greek',
    description: 'Mediterranean delights',
    imageUrl: '/images/categories/cuisine/greek.png',
    meals: []
  },
  {
    id: 'korean',
    name: 'Korean',
    description: 'BBQ, kimchi, bibimbap',
    imageUrl: '/images/categories/cuisine/korean.png',
    meals: []
  },
  {
    id: 'french',
    name: 'French',
    description: 'Elegant bistro classics',
    imageUrl: '/images/categories/cuisine/french.png',
    meals: []
  },
  {
    id: 'middle-eastern',
    name: 'Middle Eastern',
    description: 'Falafel, shawarma & more',
    imageUrl: '/images/categories/cuisine/middle-eastern.png',
    meals: []
  },
  {
    id: 'bbq',
    name: 'BBQ',
    description: 'Smoky grilled goodness',
    imageUrl: '/images/categories/cuisine/bbq.png',
    meals: []
  }
];

// Sweet-treat categories with images
export const treatsCategories: MealCategory[] = [
  {
    id: 'cookies',
    name: 'Cookies',
    description: 'Chewy, crispy & everything in-between',
    imageUrl: '/images/categories/treats/cookies.png',
    meals: []
  },
  {
    id: 'cakes',
    name: 'Cakes',
    description: 'Layers of sweetness for any occasion',
    imageUrl: '/images/categories/treats/cakes.png',
    meals: []
  },
  {
    id: 'brownies',
    name: 'Brownies',
    description: 'Fudgy, gooey chocolate bites',
    imageUrl: '/images/categories/treats/brownies.png',
    meals: []
  },
  {
    id: 'ice-cream',
    name: 'Ice Cream',
    description: 'Scoops of frozen delight',
    imageUrl: '/images/categories/treats/ice-cream.png',
    meals: []
  },
  {
    id: 'pastries',
    name: 'Pastries',
    description: 'Flaky, buttery perfection',
    imageUrl: '/images/categories/treats/pastries.png',
    meals: []
  },
  {
    id: 'donuts-muffins',
    name: 'Donuts & Muffins',
    description: 'Morning pick-me-ups',
    imageUrl: '/images/categories/treats/donuts-and-muffins.png',
    meals: []
  },
  {
    id: 'pies',
    name: 'Pies',
    description: 'Sweet & savory fillings',
    imageUrl: '/images/categories/treats/pies.png',
    meals: []
  },
  {
    id: 'fruit-desserts',
    name: 'Fruit Desserts',
    description: 'Naturally sweet treats',
    imageUrl: '/images/categories/treats/fruit-desserts.png',
    meals: []
  },
  {
    id: 'chocolate',
    name: 'Chocolate Treats',
    description: 'Decadent cocoa creations',
    imageUrl: '/images/categories/treats/chocolate-treats.png',
    meals: []
  },
  {
    id: 'healthy',
    name: 'Healthy Desserts',
    description: 'Guilt-free indulgence',
    imageUrl: '/images/categories/treats/healthy-deserts.png',
    meals: []
  }
];

// Carousel sections structure
export const mealCarouselSections: CarouselSection[] = [
  {
    id: 'diet-based',
    title: 'Diet-Based',
    subtitle: 'Build with pAIr',
    categories: dietBasedCategories
  },
  {
    id: 'cuisine',
    title: 'Cuisine',
    subtitle: 'Build with pAIr',
    categories: cuisineCategories
  },
  {
    id: 'treats',
    title: 'Sweet Treats',
    subtitle: 'Build with pAIr',
    categories: treatsCategories
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