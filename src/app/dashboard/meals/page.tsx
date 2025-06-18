"use client";

import { MealDialog } from "@/features/meals/components/meal-dialog";
import { Meal, dummyMeals, quickMealCategories } from "@/lib/dummy-data";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { motion } from "framer-motion";
import { ChefHat, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RecentMeal {
  id: string;
  meal_name: string;
  cooking_time: string;
  rating: number;
  category: string;
  dietary_tags: string[];
  ingredients: string[];
  steps: string[];
  nutrition: any;
  created_at: string;
  created_from_groceries: boolean;
}

export default function MealsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentMeals, setRecentMeals] = useState<RecentMeal[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [aiMeal, setAiMeal] = useState<RecentMeal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const selectedMeal = selectedCategory
    ? dummyMeals.find((meal) => meal.category === selectedCategory) ?? null
    : aiMeal;

  const handleNext = async () => {
    if (!selectedMeal) return;

    if ('meal_name' in selectedMeal) {
      // It's already a RecentMeal
      setRecentMeals((prev) => [selectedMeal, ...prev]);
    } else {
      // It's a template Meal, convert it to RecentMeal
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newMeal: RecentMeal = {
        id: selectedMeal.id,
        meal_name: selectedMeal.name,
        cooking_time: selectedMeal.cookingTime,
        rating: selectedMeal.rating,
        category: selectedMeal.category,
        dietary_tags: selectedMeal.dietaryTags,
        ingredients: selectedMeal.ingredients,
        steps: selectedMeal.steps,
        nutrition: selectedMeal.nutrition,
        created_at: new Date().toISOString(),
        created_from_groceries: false
      };

      const { error: mealError } = await supabase
        .from('recent_meals')
        .insert([{
          ...newMeal,
          user_id: user.id
        }]);

      if (mealError) {
        console.error('Error saving meal:', mealError);
        toast.error('Failed to save meal');
        return;
      }

      setRecentMeals((prev) => [newMeal, ...prev]);
    }

    setSelectedCategory(null);
    setAiMeal(null);
  };

  const toggleFavorite = (mealId: string) => {
    setFavoriteMeals((prev) =>
      prev.includes(mealId)
        ? prev.filter((id) => id !== mealId)
        : [...prev, mealId]
    );
  };

  const generateMealFromGroceries = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/meal-suggestions', {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate meal suggestion');
      }

      const meal = await response.json();
      setAiMeal(meal);
      loadRecentMeals(); // Reload recent meals to include the new one
    } catch (error) {
      console.error('Error generating meal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate meal suggestion');
    } finally {
      setIsGenerating(false);
    }
  };

  const convertToMealFormat = (meal: RecentMeal | Meal): Meal => {
    if ('meal_name' in meal) {
      return {
        id: meal.id,
        name: meal.meal_name,
        cookingTime: meal.cooking_time,
        rating: meal.rating,
        category: meal.category === 'main' ? 'high-protein' : 'random',
        dietaryTags: meal.dietary_tags,
        ingredients: meal.ingredients,
        steps: meal.steps,
        nutrition: meal.nutrition
      };
    }
    return meal;
  };

  return (
    <main className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Quick Meals</h1>
        <p className="text-muted-foreground">
          Select a category to discover delicious and easy-to-make meals.
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={generateMealFromGroceries}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChefHat className="h-4 w-4" />
          )}
          Create from Groceries
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {quickMealCategories.map((category) => (
          <motion.button
            key={category.id}
            className={`${category.color} ${category.textColor} rounded-xl p-6 aspect-square flex flex-col items-center justify-center gap-4 transition-colors`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="text-4xl">{category.icon}</span>
            <span className="text-lg font-medium text-center">{category.name}</span>
          </motion.button>
        ))}
      </div>

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
              No previous meals yet. Start by selecting a category above!
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

      <MealDialog
        meal={selectedMeal ? convertToMealFormat(selectedMeal) : null}
        isOpen={!!selectedCategory || !!aiMeal}
        onClose={() => {
          setSelectedCategory(null);
          setAiMeal(null);
        }}
        onNext={handleNext}
      />
    </main>
  );
} 