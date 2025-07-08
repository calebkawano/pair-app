/* Dietary related static lists shared across the app.
 * These are kept in a central constants file so that UI components
 * and API layers stay in sync.
 */

export interface Option {
  label: string;
  value: string;
}

// High-level dietary goal selections
export const DIETARY_GOAL_OPTIONS: Option[] = [
  { label: 'Healthy Eating', value: 'healthy' },
  { label: 'Weight Loss', value: 'weight-loss' },
  { label: 'Muscle Gain', value: 'muscle-gain' },
  { label: 'Balanced Diet', value: 'balanced' },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Keto', value: 'keto' },
  { label: 'Paleo', value: 'paleo' },
];

// Preferred cooking duration presets
export const COOKING_TIME_OPTIONS: Option[] = [
  { label: 'Minimal (15-20 mins)', value: 'minimal' },
  { label: 'Moderate (30-45 mins)', value: 'moderate' },
  { label: 'Cooking is my hobby (1+ hours)', value: 'hobby' },
  { label: 'Weekly meal prep', value: 'meal-prep' },
];

// Broad cuisine or category picks
export const FOOD_CATEGORY_OPTIONS: Option[] = [
  { label: 'Italian', value: 'italian' },
  { label: 'Mexican', value: 'mexican' },
  { label: 'Chinese', value: 'chinese' },
  { label: 'Indian', value: 'indian' },
  { label: 'Japanese', value: 'japanese' },
]; 