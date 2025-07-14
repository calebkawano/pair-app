"use client";

import { Button } from "@/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";
import { Star, Utensils } from "lucide-react";
import { useState } from "react";
import { MealDialog } from "./meal-dialog";

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

interface RecentMealsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recentMeals: RecentMeal[];
  onGoToMeals: () => void;
}

export function RecentMealsDialog({ 
  isOpen, 
  onClose, 
  recentMeals, 
  onGoToMeals 
}: RecentMealsDialogProps) {
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  const selectedMeal = selectedMealId 
    ? recentMeals.find(meal => meal.id === selectedMealId) ?? null
    : null;

  const handleMealClick = (mealId: string) => {
    setSelectedMealId(mealId);
  };

  const handleMealDialogClose = () => {
    setSelectedMealId(null);
  };

  const handleMealNext = () => {
    setSelectedMealId(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Recent Meals
                </DialogTitle>
                <DialogDescription>
                  Your previously planned meals
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onGoToMeals}>
                  More Quick Meals
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentMeals.length > 0 ? (
              recentMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleMealClick(meal.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{meal.meal_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{meal.cooking_time}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        {meal.rating}
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      {meal.created_from_groceries && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">From Groceries</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent meals yet.</p>
                <p className="text-sm">Start planning some meals to see them here!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedMeal && (
        <MealDialog
          meal={{
            id: selectedMeal.id,
            name: selectedMeal.meal_name,
            cookingTime: selectedMeal.cooking_time,
            rating: selectedMeal.rating,
            category: selectedMeal.category === 'main' ? 'high-protein' : 'random',
            dietaryTags: selectedMeal.dietary_tags,
            ingredients: selectedMeal.ingredients,
            steps: selectedMeal.steps,
            nutrition: selectedMeal.nutrition,
            imageUrl: '' // We don't store images yet
          }}
          isOpen={!!selectedMealId}
          onClose={handleMealDialogClose}
          onNext={handleMealNext}
        />
      )}
    </>
  );
} 