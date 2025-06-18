"use client";

import { DietaryTag, Meal, dietaryTags } from "@/lib/dummy-data";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Check, Info, Star, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MealDialogProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
}

export function MealDialog({ meal, isOpen, onClose, onNext }: MealDialogProps) {
  const [showNutrition, setShowNutrition] = useState(false);

  if (!meal) return null;

  const NutritionDialog = () => (
    <Dialog open={showNutrition} onOpenChange={setShowNutrition}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nutrition Facts</DialogTitle>
          <DialogDescription>
            Per serving
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Calories</p>
              <p className="text-muted-foreground">{meal.nutrition.calories}</p>
            </div>
            <div>
              <p className="font-medium">Protein</p>
              <p className="text-muted-foreground">{meal.nutrition.protein}g</p>
            </div>
            <div>
              <p className="font-medium">Carbs</p>
              <p className="text-muted-foreground">{meal.nutrition.carbs}g</p>
            </div>
            <div>
              <p className="font-medium">Fat</p>
              <p className="text-muted-foreground">{meal.nutrition.fat}g</p>
            </div>
            <div>
              <p className="font-medium">Fiber</p>
              <p className="text-muted-foreground">{meal.nutrition.fiber}g</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{meal.name}</DialogTitle>
            <DialogDescription>
              {meal.cookingTime} · {meal.rating} <Star className="inline-block h-4 w-4 fill-yellow-400 text-yellow-400" />
            </DialogDescription>
          </DialogHeader>

          {meal.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={meal.imageUrl}
                alt={meal.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {meal.dietaryTags
              .map((tag) => {
                const dietaryTag = dietaryTags[tag] as DietaryTag;
                if (!dietaryTag) {
                  console.warn(`Dietary tag "${tag}" not found in dietaryTags`);
                  return null;
                }
                return { tag, dietaryTag };
              })
              .filter((item): item is { tag: string; dietaryTag: DietaryTag } => item !== null)
              .map(({ tag, dietaryTag }) => (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm ${dietaryTag.color} bg-opacity-10`}
                >
                  {dietaryTag.icon} {dietaryTag.label}
                </span>
              ))}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Ingredients</h4>
              <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Steps</h4>
              <ol className="list-decimal pl-4 space-y-1 text-sm text-muted-foreground">
                {meal.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNutrition(true)}
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                <X className="h-4 w-4 mr-2" />
                Skip
              </Button>
            </div>
            <Button onClick={onNext} className="w-full sm:w-auto">
              <Check className="h-4 w-4 mr-2" />
              Select This Meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NutritionDialog />
    </>
  );
} 