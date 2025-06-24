"use client";

import { Meal } from "@/lib/dummy-data";
import { Button } from "@/ui/button";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Heart, Star, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface SwipeableMealCardProps {
  meal: Meal;
  onSwipeLeft: () => void; // Not interested
  onSwipeRight: () => void; // Let's cook this
  onClose: () => void;
}

export function SwipeableMealCard({ meal, onSwipeLeft, onSwipeRight, onClose }: SwipeableMealCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

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
        <div className="relative h-full">
          {/* Meal Image */}
          <div className="relative h-2/3">
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
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{meal.name}</h1>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{meal.rating}</span>
                </div>
              </div>
              <p className="text-white/80">{meal.cookingTime}</p>
              
              {/* Dietary Tags */}
              <div className="flex gap-2 flex-wrap">
                {meal.dietaryTags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs"
                  >
                    {tag.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-8">
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
    </div>
  );
} 