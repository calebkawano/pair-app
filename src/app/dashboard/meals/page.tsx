"use client";

import { MealCarousel } from "@/features/meals/components/meal-carousel";
import { SwipeableMealCard } from "@/features/meals/components/swipeable-meal-card";
import { Meal, MealCategory, dummyMeals, mealCarouselSections } from "@/lib/dummy-data";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { ChefHat, Dice6, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface RecentMeal {
  id: string;
  meal_name: string;
  cooking_time: string;
  rating: number;
  category: string;
  dietary_tags: string[];
  ingredients: string[];
  steps: string[];
  nutrition: NutritionInfo | null;
  created_at: string;
  created_from_groceries: boolean;
}

// Interface for API meal data
interface ApiMealData {
  id?: string;
  meal_name?: string;
  name?: string;
  category?: string;
  cooking_time?: string;
  cookingTime?: string;
  rating?: number;
  dietary_tags?: string[];
  dietaryTags?: string[];
  ingredients?: string[];
  steps?: string[];
  nutrition?: NutritionInfo;
  imageUrl?: string;
}

// Function to convert API meal data to frontend Meal interface
const convertApiMealToMeal = (apiMeal: ApiMealData): Meal => {
  return {
    id: apiMeal.id || Math.random().toString(36).substring(7),
    name: apiMeal.meal_name || apiMeal.name || 'Untitled Meal',
    category: apiMeal.category || 'random',
    cookingTime: apiMeal.cooking_time || apiMeal.cookingTime || '30 mins',
    rating: apiMeal.rating || 4,
    dietaryTags: apiMeal.dietary_tags || apiMeal.dietaryTags || [],
    ingredients: apiMeal.ingredients || [],
    steps: apiMeal.steps || [],
    nutrition: apiMeal.nutrition || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0
    },
    imageUrl: apiMeal.imageUrl || ''
  };
};

export default function MealsPage() {
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | null>(null);
  const [currentMeal, setCurrentMeal] = useState<Meal | null>(null);
  const [currentMealIndex, setCurrentMealIndex] = useState(0);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false);
  const [isGeneratingGroceries, setIsGeneratingGroceries] = useState(false);
  const [viewedRandomMeals, setViewedRandomMeals] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    loadRecentMeals();
  }, []);

  const loadRecentMeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: meals, error } = await supabase
        .from('recent_meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recent meals:', error);
        toast.error('Failed to load recent meals');
        return;
      }

      if (meals) {
        setRecentMeals(meals);
      }
    } catch (error) {
      console.error('Error in loadRecentMeals:', error);
      toast.error('Failed to load recent meals');
    }
  };

  const handleCategorySelect = (category: MealCategory) => {
    setSelectedCategory(category);
    // For now, use dummy meals - later this will be AI-generated meals for the category
    const categoryMeals = dummyMeals.filter(meal => 
      meal.category === category.id || 
      (category.id === 'high-protein' && meal.category === 'high-protein')
    );
    
    if (categoryMeals.length > 0) {
      setCurrentMeal(categoryMeals[0]);
      setCurrentMealIndex(0);
    } else {
      // Generate a meal for this category
      generateMealForCategory(category);
    }
  };

  const generateMealForCategory = async (category: MealCategory) => {
    try {
      // This would call your meal generation API with the category
      const response = await fetch('/api/meal-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: category.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal suggestion');
      }

      const apiMeal = await response.json();
      const meal = convertApiMealToMeal(apiMeal);
      setCurrentMeal(meal);
      setCurrentMealIndex(0);
    } catch (error) {
      console.error('Error generating meal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate meal suggestion');
      setSelectedCategory(null);
    } finally {
      /* no-op */
    }
  };

  const handleSwipeLeft = () => {
    // Move to next meal or generate a new one
    const categoryMeals = dummyMeals.filter(meal => 
      meal.category === selectedCategory?.id || 
      (selectedCategory?.id === 'high-protein' && meal.category === 'high-protein')
    );
    
    if (currentMealIndex < categoryMeals.length - 1) {
      const nextIndex = currentMealIndex + 1;
      setCurrentMeal(categoryMeals[nextIndex]);
      setCurrentMealIndex(nextIndex);
    } else {
      // Generate a new meal or show a message
      if (selectedCategory) {
        generateMealForCategory(selectedCategory);
      }
    }
  };

  const handleSwipeRight = async () => {
    if (!currentMeal) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to save meals');
      return;
    }

    try {
      // Prepare meal data for saving
      const mealData = {
        user_id: user.id,
        meal_name: currentMeal.name,
        cooking_time: currentMeal.cookingTime,
        rating: currentMeal.rating,
        category: currentMeal.category,
        dietary_tags: currentMeal.dietaryTags || [],
        ingredients: currentMeal.ingredients || [],
        steps: currentMeal.steps || [],
        nutrition: currentMeal.nutrition || null,
        created_from_groceries: selectedCategory?.id === 'groceries'
      };

      console.log('Saving meal data:', mealData);

      const { data, error: mealError } = await supabase
        .from('recent_meals')
        .insert([mealData])
        .select();

      if (mealError) {
        console.error('Detailed error saving meal:', {
          error: mealError,
          code: mealError.code,
          message: mealError.message,
          details: mealError.details,
          hint: mealError.hint
        });
        toast.error(`Failed to save meal: ${mealError.message || mealError.code || 'Unknown database error'}`);
        return;
      }

      console.log('Meal saved successfully:', data);
      toast.success('Meal saved successfully!');
      loadRecentMeals(); // Reload recent meals
      setSelectedCategory(null);
      setCurrentMeal(null);
    } catch (error) {
      console.error('Unexpected error saving meal:', error);
      toast.error('An unexpected error occurred while saving the meal');
    }
  };

  const handleCloseMealCard = () => {
    setSelectedCategory(null);
    setCurrentMeal(null);
  };

  const generateRandomMeal = async () => {
    if (isGeneratingGroceries || isGeneratingRandom) return; // guard
    setIsGeneratingRandom(true);
    try {
      // Try to pick an unseen dummy meal first
      const unseen = dummyMeals.filter((m) => !viewedRandomMeals.has(m.id));
      if (unseen.length > 0) {
        const meal = unseen[Math.floor(Math.random() * unseen.length)];
        setViewedRandomMeals((prev) => new Set(prev).add(meal.id));
        setCurrentMeal(meal);
        setSelectedCategory({ id: 'random', name: 'Random', description: 'Surprise meal', imageUrl: '', meals: [] });
        return;
      }

      // All dummy meals viewed, fall back to API
      const response = await fetch('/api/meal-suggestions', {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal suggestion');
      }

      const apiMeal = await response.json();
      const meal = convertApiMealToMeal(apiMeal);
      setCurrentMeal(meal);
      setSelectedCategory({ id: 'random', name: 'Random', description: 'Surprise meal', imageUrl: '', meals: [] });
    } catch (error) {
      console.error('Error generating meal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate meal suggestion');
    } finally {
      setIsGeneratingRandom(false);
    }
  };

  const generateMealFromGroceries = async () => {
    if (isGeneratingGroceries || isGeneratingRandom) return; // guard
    setIsGeneratingGroceries(true);
    try {
      const response = await fetch('/api/meal-suggestions', {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal suggestion');
      }

      const apiMeal = await response.json();
      const meal = convertApiMealToMeal(apiMeal);
      setCurrentMeal(meal);
      setSelectedCategory({ id: 'groceries', name: 'From Groceries', description: 'Made from your groceries', imageUrl: '', meals: [] });
    } catch (error) {
      console.error('Error generating meal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate meal suggestion');
    } finally {
      setIsGeneratingGroceries(false);
    }
  };

  const toggleFavorite = (mealId: string) => {
    setFavoriteMeals((prev) =>
      prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : [...prev, mealId]
    );
  };

  return (
    <main className="container max-w-6xl mx-auto p-4 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Discover Meals</h1>
        <p className="text-muted-foreground">
          Swipe through personalized meal suggestions or explore by category.
        </p>
      </div>

      {/* Meal Carousels */}
      <div className="space-y-8">
        {mealCarouselSections.map((section) => (
          <MealCarousel
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            categories={section.categories}
            onCategorySelect={handleCategorySelect}
          />
        ))}
      </div>

      {/* Meals Made with pAIr */}
      <Card>
        <CardHeader>
          <CardTitle>Meals Made with pAIr</CardTitle>
          <CardDescription>
            Get instant meal suggestions powered by AI
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 disabled:opacity-50"
            onClick={generateRandomMeal}
            disabled={isGeneratingRandom}
          >
            {isGeneratingRandom ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Dice6 className="h-6 w-6" />
            )}
            <div className="text-center">
              <p className="font-medium">Random Meal</p>
              <p className="text-xs text-muted-foreground">Surprise me!</p>
            </div>
          </Button>
          <Button
            className="h-24 flex flex-col gap-2 disabled:opacity-50"
            onClick={generateMealFromGroceries}
            disabled={isGeneratingGroceries}
          >
            {isGeneratingGroceries ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ChefHat className="h-6 w-6" />
            )}
            <div className="text-center">
              <p className="font-medium">Make from Groceries</p>
              <p className="text-xs opacity-80">Use what you have</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Previous Meals & Favorites */}
      <Tabs defaultValue="previous" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="previous">Previous Meals</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <TabsContent value="previous" className="mt-6">
          {recentMeals.length > 0 ? (
            <div className="space-y-4">
              {recentMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h3 className="font-medium">{meal.meal_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{meal.cooking_time}</span>
                      {meal.created_from_groceries && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">From Groceries</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(meal.id)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                    aria-label={favoriteMeals.includes(meal.id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        favoriteMeals.includes(meal.id)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No previous meals yet. Start by exploring categories above!
            </div>
          )}
        </TabsContent>
        <TabsContent value="favorites" className="mt-6">
          {favoriteMeals.length > 0 ? (
            <div className="space-y-4">
              {recentMeals
                .filter((meal) => favoriteMeals.includes(meal.id))
                .map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h3 className="font-medium">{meal.meal_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{meal.cooking_time}</span>
                        {meal.created_from_groceries && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">From Groceries</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(meal.id)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                      aria-label="Remove from favorites"
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Go to your recent meals and add some favorites!
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Swipeable Meal Card */}
      {currentMeal && (
        <SwipeableMealCard
          meal={currentMeal}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onClose={handleCloseMealCard}
          showAddToCart={selectedCategory?.id === 'random'}
        />
      )}
    </main>
  );
} 