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
import { Check, ChevronDown, Heart, Info, Star, X } from "lucide-react";
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
  const [ingredientStatuses, setIngredientStatuses] = useState<IngredientStatus[]>([]);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Initialize ingredient statuses when meal changes
  useEffect(() => {
    if (meal?.ingredients) {
      setIngredientStatuses(
        meal.ingredients.map((name) => ({ 
          name, 
          inCart: false, 
          hasItem: false 
        }))
      );
    }
  }, [meal?.ingredients]);

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

  const handleDragEnd = (event: PointerEvent, info: PanInfo) => {
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
    if (showAddToCart && ingredientStatuses.length > 0) {
      checkExistingItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddToCart, ingredientStatuses.length]);

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

  const addAllToCart = async () => {
    for (const ing of ingredientStatuses) {
      if (!ing.hasItem) {
        await addIngredientToCart(ing.name);
      }
    }
  };

  // Check if we should show add to cart functionality (only for random meals and if any ingredients are missing)
  const shouldShowAddToCart = showAddToCart && ingredientStatuses.some(ing => !ing.hasItem);

  // Helper to determine if nutrition data is present
  const hasNutrition = meal.nutrition && Object.values(meal.nutrition).some((v) => v !== undefined && v !== null);

  // Lock background scrolling while card is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Hide scroll hint after user scrolls
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop > 20) {
        setShowScrollHint(false);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

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
          className="absolute inset-0 bg-red-500 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: leftOverlayOpacity }}
        >
          <div className="text-white text-center">
            <X className="h-16 w-16 mx-auto mb-2" />
            <p className="text-xl font-bold">Not Interested</p>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-0 bg-green-500 flex items-center justify-center z-10 pointer-events-none"
          style={{ opacity: rightOverlayOpacity }}
        >
          <div className="text-white text-center">
            <Heart className="h-16 w-16 mx-auto mb-2" />
            <p className="text-xl font-bold">Let&apos;s Cook This!</p>
          </div>
        </motion.div>

        {/* Meal Content */}
        <div className="relative h-full flex flex-col">
          {/* Meal Image or Header */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
            {meal.imageUrl ? (
              <>
                <Image
                  src={meal.imageUrl}
                  alt={meal.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">AI Generated Meal</p>
                </div>
              </div>
            )}
            
            {/* Header buttons - positioned to not overlap */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Meal Info with proper scrolling */}
          <div className="flex-1 flex flex-col bg-background text-foreground min-h-0">
            {/* Fixed header section */}
            <div className="p-6 pb-0 flex-shrink-0">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-xl font-bold leading-tight">{meal.name}</h1>
                    <p className="text-muted-foreground text-sm">{meal.cookingTime}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{meal.rating}</span>
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
            </div>

            {/* Scrollable content */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
              {/* Ingredients */}
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  Ingredients
                  {shouldShowAddToCart && (
                    <Button variant="outline" size="sm" onClick={addAllToCart}>
                      Add All
                    </Button>
                  )}
                </h3>
                <ul className="space-y-1 text-sm">
                  {ingredientStatuses.map((ing) => (
                    <li key={ing.name} className="flex items-center gap-2 py-1">
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className={ing.hasItem ? 'line-through opacity-70 flex-1' : 'flex-1'}>{ing.name}</span>
                      {shouldShowAddToCart && !ing.hasItem && (
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
                <h3 className="font-medium mb-2">Instructions</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  {(meal.steps || []).map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-medium">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Scroll Hint */}
            {showScrollHint && (
              <div className="absolute bottom-21 left-1/2 -translate-x-1/2 flex flex-col items-center text-muted-foreground animate-bounce pointer-events-none">
                <ChevronDown className="h-5 w-5" />
                <span className="text-xs">Scroll for steps</span>
              </div>
            )}

            {/* Action Buttons - Fixed at bottom with better visibility */}
            <div className="p-6 pt-4 flex-shrink-0 border-t bg-background">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 flex-1 gap-2"
                  onClick={handleSwipeLeft}
                >
                  <X className="h-4 w-4" />
                  Skip
                </Button>
                <Button
                  size="lg"
                  className="h-12 flex-1 bg-green-500 hover:bg-green-600 gap-2"
                  onClick={handleSwipeRight}
                >
                  <Heart className="h-4 w-4" />
                  Save Meal
                </Button>
              </div>
            </div>
          </div>
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
          {hasNutrition ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Calories</p>
                <p className="text-muted-foreground">{meal.nutrition?.calories}</p>
              </div>
              <div>
                <p className="font-medium">Protein</p>
                <p className="text-muted-foreground">{meal.nutrition?.protein}g</p>
              </div>
              <div>
                <p className="font-medium">Carbs</p>
                <p className="text-muted-foreground">{meal.nutrition?.carbs}g</p>
              </div>
              <div>
                <p className="font-medium">Fat</p>
                <p className="text-muted-foreground">{meal.nutrition?.fat}g</p>
              </div>
              <div>
                <p className="font-medium">Fiber</p>
                <p className="text-muted-foreground">{meal.nutrition?.fiber}g</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nutrition information not available for this meal.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 