"use client";

import { Meal } from "@/lib/dummy-data";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Check, Heart, Info, Star, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface IngredientStatus {
  name: string;
  inCart: boolean;
  hasItem: boolean;
}

interface SwipeableMealCardProps {
  meal: Meal;
  onSwipeLeft: () => void; // Not interested
  onSwipeRight: () => void; // Let's cook this
  onClose: () => void;
  showAddToCart?: boolean;
}

export function SwipeableMealCard({ meal, onSwipeLeft, onSwipeRight, onClose, showAddToCart = false }: SwipeableMealCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const [showNutrition, setShowNutrition] = useState(false);
  const [ingredientStatuses, setIngredientStatuses] = useState<IngredientStatus[]>(() =>
    meal.ingredients.map((name) => ({ name, inCart: false, hasItem: false }))
  );
  const supabase = createClient();

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handleSwipeLeft();
      } else if (event.key === 'ArrowRight') {
        handleSwipeRight();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSwipeLeft, onSwipeRight, onClose]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      handleSwipeRight();
    } else if (info.offset.x < -threshold) {
      handleSwipeLeft();
    } else {
      // Snap back to center
      x.set(0);
    }
  };

  const handleSwipeLeft = () => {
    x.set(-300);
    setTimeout(() => {
      onSwipeLeft();
    }, 200);
  };

  const handleSwipeRight = () => {
    x.set(300);
    setTimeout(() => {
      onSwipeRight();
    }, 200);
  };

  // Color overlays based on swipe direction
  const leftOverlayOpacity = useTransform(x, [-200, -50, 0], [0.8, 0.3, 0]);
  const rightOverlayOpacity = useTransform(x, [0, 50, 200], [0, 0.3, 0.8]);

  const checkExistingItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get unpurchased items
      const { data: cartItems } = await supabase
        .from('food_requests')
        .select('item_name')
        .eq('requested_by', user.id)
        .eq('is_purchased', false)
        .in('status', ['approved'])
        .is('deleted_at', null);

      const existingNames = (cartItems || []).map((i) => i.item_name.toLowerCase());

      setIngredientStatuses((prev) =>
        prev.map((ing) => ({
          ...ing,
          hasItem: existingNames.includes(ing.name.toLowerCase()),
        }))
      );
    } catch (err) {
      console.error('Error checking cart items:', err);
    }
  };

  useEffect(() => {
    if (showAddToCart) {
      checkExistingItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addIngredientToCart = async (ingredient: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's default household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      const householdId = householdMember?.household_id;
      if (!householdId) return;

      const { error } = await supabase.from('food_requests').insert([
        {
          household_id: householdId,
          requested_by: user.id,
          item_name: ingredient,
          quantity: 1,
          unit: 'pcs',
          priority: 'normal',
          status: 'approved',
          is_manual: true,
        },
      ]);

      if (error) throw error;

      setIngredientStatuses((prev) =>
        prev.map((ing) =>
          ing.name === ingredient ? { ...ing, inCart: true, hasItem: true } : ing
        )
      );
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const addAllToCart = () => {
    ingredientStatuses.forEach((ing) => {
      if (!ing.hasItem) {
        addIngredientToCart(ing.name);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        ref={cardRef}
        className="relative w-full max-w-sm h-[600px] bg-background rounded-2xl shadow-2xl overflow-hidden"
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.95 }}
      >
        {/* Swipe Direction Overlays */}
        <motion.div
          className="absolute inset-0 bg-red-500 flex items-center justify-center z-10"
          style={{ opacity: leftOverlayOpacity }}
        >
          <div className="text-white text-center">
            <X className="h-16 w-16 mx-auto mb-2" />
            <p className="text-xl font-bold">Not Interested</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-green-500 flex items-center justify-center z-10"
          style={{ opacity: rightOverlayOpacity }}
        >
          <div className="text-white text-center">
            <Heart className="h-16 w-16 mx-auto mb-2" />
            <p className="text-xl font-bold">Let's Cook This!</p>
          </div>
        </motion.div>

        {/* Meal Content */}
        <div className="relative h-full flex flex-col">
          {/* Meal Image */}
          <div className="relative h-1/2">
            {meal.imageUrl && (
              <Image
                src={meal.imageUrl}
                alt={meal.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Meal Info */}
          <div className="flex-1 overflow-y-auto bg-background p-6 pb-32 space-y-4 text-foreground">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">{meal.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{meal.rating}</span>
                  </div>
                  {/* Nutrition info button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowNutrition(true)}
                  >
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">{meal.cookingTime}</p>

              {/* Dietary Tags */}
              <div className="flex gap-2 flex-wrap">
                {(meal.dietaryTags || []).slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                  >
                    {tag.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                Ingredients
                {showAddToCart && (
                  <Button variant="outline" size="sm" onClick={addAllToCart}>
                    Add All
                  </Button>
                )}
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                {ingredientStatuses.map((ing) => (
                  <li key={ing.name} className="flex items-center gap-2">
                    <span className={ing.hasItem ? 'line-through opacity-70' : ''}>{ing.name}</span>
                    {showAddToCart && !ing.hasItem && (
                      <Button variant="ghost" size="sm" onClick={() => addIngredientToCart(ing.name)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {ing.hasItem && <span className="text-green-600 text-xs">In Cart</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div>
              <h3 className="font-medium mb-2">Steps</h3>
              <ol className="list-decimal pl-4 space-y-1 text-sm text-muted-foreground">
                {meal.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 left-6 flex gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-red-500 hover:border-red-500"
            onClick={handleSwipeLeft}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 border-0"
            onClick={handleSwipeRight}
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      </motion.div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-white/80">
        <p className="text-sm">Swipe or use arrow keys • ESC to close</p>
      </div>

      {/* Nutrition Dialog */}
      <Dialog open={showNutrition} onOpenChange={setShowNutrition}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nutrition Facts</DialogTitle>
            <DialogDescription>Per serving</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 text-sm">
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
        </DialogContent>
      </Dialog>
    </div>
  );
} 