import type { DietaryTag } from './types'

export const dietaryTags: Record<string, DietaryTag> = {
  vegan: { label: 'Vegan', color: 'text-green-600', icon: '🌱' },
  vegetarian: { label: 'Vegetarian', color: 'text-emerald-600', icon: '🥬' },
  highProtein: { label: 'High Protein', color: 'text-red-600', icon: '💪' },
  glutenFree: { label: 'Gluten Free', color: 'text-yellow-600', icon: '🌾' },
  dairyFree: { label: 'Dairy Free', color: 'text-blue-600', icon: '🥛' },
  keto: { label: 'Keto', color: 'text-purple-600', icon: '🥑' },
  paleo: { label: 'Paleo', color: 'text-orange-600', icon: '🥩' },
  mediterranean: { label: 'Mediterranean', color: 'text-blue-500', icon: '🫒' },
  lowCarb: { label: 'Low Carb', color: 'text-indigo-600', icon: '🥒' },
  antiInflammatory: { label: 'Anti-Inflammatory', color: 'text-pink-600', icon: '🫐' },
  heartHealthy: { label: 'Heart Healthy', color: 'text-red-500', icon: '❤️' },
  weightLoss: { label: 'Weight Loss', color: 'text-green-500', icon: '⚖️' },
  muscleBuilding: { label: 'Muscle Building', color: 'text-red-600', icon: '💪' },
  smoothies: { label: 'Smoothies', color: 'text-purple-500', icon: '🥤' },
  whole30: { label: 'Whole30', color: 'text-amber-600', icon: '🌿' },
}


