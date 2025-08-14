import axios from 'axios'
import type { Meal } from '@/lib/meals/types'

const SPOONACULAR_API_BASE = 'https://api.spoonacular.com'

function getApiKey(): string {
  const key = process.env.SPOONACULAR_API_KEY
  if (!key) {
    throw new Error('SPOONACULAR_API_KEY is not set. Add it to your .env.local (server-only).')
  }
  return key
}

type Maybe<T> = T | undefined | null

interface SpoonacularSearchParams {
  query?: string
  number?: number
  offset?: number
  cuisine?: string
  diet?: string
  includeIngredients?: string // comma-separated
  maxReadyTime?: number
}

interface SpoonacularIngredient {
  id: number
  name: string
  original: string
}

interface SpoonacularInstructionStep {
  number: number
  step: string
}

interface SpoonacularInstructionBlock {
  name: string
  steps: SpoonacularInstructionStep[]
}

interface SpoonacularRecipe {
  id: number
  title: string
  image?: string
  readyInMinutes?: number
  diets?: string[]
  dishTypes?: string[]
  extendedIngredients?: SpoonacularIngredient[]
  analyzedInstructions?: SpoonacularInstructionBlock[]
}

interface SpoonacularSearchResponse {
  results: SpoonacularRecipe[]
  offset: number
  number: number
  totalResults: number
}

function mapDietOrCuisineToCategory(diets: string[] = [], cuisine?: string): Meal['category'] {
  const lowerDiets = diets.map((d) => d.toLowerCase())
  if (lowerDiets.includes('vegan')) return 'vegan'
  if (lowerDiets.includes('vegetarian')) return 'vegetarian'
  if (lowerDiets.includes('ketogenic')) return 'keto'
  if (lowerDiets.includes('gluten free')) return 'random'
  // TODO: Add more diet types available in Meals

  const c = (cuisine || '').toLowerCase()
  if (['mexican', 'chinese', 'indian', 'italian', 'japanese', 'thai', 'greek', 'korean', 'french', 'middle eastern', 'bbq'].includes(c)) {
    // Fall back to 'random' because Meal['category'] union is narrowed; UI uses category filters separately.
    return 'random'
  }
  return 'random'
}

function normalizeRecipe(recipe: SpoonacularRecipe): Meal {
  const ingredients: string[] = (recipe.extendedIngredients || []).map((i) => i.name || i.original).filter(Boolean)
  const steps: string[] = (recipe.analyzedInstructions || [])
    .flatMap((b) => b.steps || [])
    .map((s) => s.step)
    .filter(Boolean)

  return {
    id: String(recipe.id),
    name: recipe.title || 'Untitled Meal',
    category: mapDietOrCuisineToCategory(recipe.diets || []),
    cookingTime: recipe.readyInMinutes ? `${recipe.readyInMinutes} mins` : '30 mins',
    rating: 4, // Default; you can compute from popularity later
    dietaryTags: [...(recipe.diets || []), ...(recipe.dishTypes || [])],
    ingredients,
    steps,
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    },
    imageUrl: recipe.image,
  }
}

export async function searchRecipes(params: SpoonacularSearchParams): Promise<{ items: Meal[]; total: number; offset: number; number: number }> {
  const apiKey = getApiKey()
  const url = new URL(`${SPOONACULAR_API_BASE}/recipes/complexSearch`)

  const queryParams: Record<string, Maybe<string | number>> = {
    apiKey,
    addRecipeInformation: 'true',
    instructionsRequired: 'true',
    query: params.query,
    number: params.number ?? 20,
    offset: params.offset ?? 0,
    cuisine: params.cuisine,
    diet: params.diet,
    includeIngredients: params.includeIngredients,
    maxReadyTime: params.maxReadyTime,
  }

  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })

  const { data } = await axios.get<SpoonacularSearchResponse>(url.toString())
  const items = (data.results || []).map(normalizeRecipe)
  return { items, total: data.totalResults, offset: data.offset, number: data.number }
}

export async function getRecipeById(id: string | number): Promise<Meal> {
  const apiKey = getApiKey()
  const { data } = await axios.get<SpoonacularRecipe>(
    `${SPOONACULAR_API_BASE}/recipes/${id}/information?includeNutrition=false&apiKey=${apiKey}`
  )
  return normalizeRecipe(data)
}


