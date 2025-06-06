"use client";

import { MealDialog } from "@/components/meals/meal-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dummyMeals, quickMealCategories } from "@/lib/dummy-data";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useState } from "react";

export default function MealsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentMeal, setCurrentMeal] = useState<number>(0);
  const [previousMeals, setPreviousMeals] = useState<string[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);

  const selectedMeal = selectedCategory
    ? dummyMeals.find((meal) => meal.category === selectedCategory)
    : null;

  const handleNext = () => {
    if (selectedMeal) {
      setPreviousMeals((prev) => [...new Set([...prev, selectedMeal.id])]);
      setSelectedCategory(null);
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
    <main className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Quick Meals</h1>
        <p className="text-muted-foreground">
          Select a category to discover delicious and easy-to-make meals.
        </p>
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
          {previousMeals.length > 0 ? (
            <div className="space-y-4">
              {previousMeals.map((mealId) => {
                const meal = dummyMeals.find((m) => m.id === mealId);
                if (!meal) return null;
                return (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h3 className="font-medium">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {meal.cookingTime}
                      </p>
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
                );
              })}
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
              {favoriteMeals.map((mealId) => {
                const meal = dummyMeals.find((m) => m.id === mealId);
                if (!meal) return null;
                return (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <h3 className="font-medium">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {meal.cookingTime}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(meal.id)}
                      className="p-2 hover:bg-secondary rounded-full transition-colors"
                      aria-label="Remove from favorites"
                    >
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Go to your recent meals and add some favorites!
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MealDialog
        meal={selectedMeal}
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onNext={handleNext}
      />
    </main>
  );
} 