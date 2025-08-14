export { dietaryTags } from '@/lib/meals/dietary-tags'
export type { DietaryTag, Meal, MealCategory, CarouselSection } from '@/lib/meals/types'
import type { Meal } from '@/lib/meals/types'

// Re-exported from meals module to preserve existing imports

// Diet-based meal categories with images
export { dietBasedCategories, cuisineCategories, treatsCategories, mealCarouselSections } from '@/lib/meals/categories'

// Cuisine-based meal categories with images

// Sweet-treat categories with images

// Carousel sections structure
// Re-exported from meals module to preserve existing imports

// Deprecated dummyMeals – use `/api/meals` instead
export const dummyMeals: Meal[] = []