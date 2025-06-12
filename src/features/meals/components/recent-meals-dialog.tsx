"use client";

import { dummyMeals } from "@/lib/dummy-data";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Star, Utensils, X } from "lucide-react";
import { useState } from "react";
import { MealDialog } from "./meal-dialog";

interface RecentMealsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recentMealIds: string[];
  onGoToMeals: () => void;
}

export function RecentMealsDialog({ 
  isOpen, 
  onClose, 
  recentMealIds, 
  onGoToMeals 
}: RecentMealsDialogProps) {
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);

  const selectedMeal = selectedMealId 
    ? dummyMeals.find(meal => meal.id === selectedMealId) ?? null
    : null;

  const handleMealClick = (mealId: string) => {
    setSelectedMealId(mealId);
  };

  const handleMealDialogClose = () => {
    setSelectedMealId(null);
  };

  const handleMealNext = () => {
    setSelectedMealId(null);
    // Could add logic here to add to recent meals again
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
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentMealIds.length > 0 ? (
              recentMealIds.map((mealId) => {
                const meal = dummyMeals.find((m) => m.id === mealId);
                if (!meal) return null;
                
                return (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleMealClick(meal.id)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{meal.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{meal.cookingTime}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {meal.rating}
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                );
              })
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

      <MealDialog
        meal={selectedMeal}
        isOpen={!!selectedMealId}
        onClose={handleMealDialogClose}
        onNext={handleMealNext}
      />
    </>
  );
} 