"use client";

import { MealCategory } from "@/lib/dummy-data";
import { Button } from "@/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface MealCarouselProps {
  title: string;
  subtitle: string;
  categories: MealCategory[];
  onCategorySelect: (category: MealCategory) => void;
}

export function MealCarousel({ title, subtitle, categories, onCategorySelect }: MealCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollLeft}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={scrollRight}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {categories.map((category) => (
            <MealCategoryCard
              key={category.id}
              category={category}
              onSelect={onCategorySelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MealCategoryCardProps {
  category: MealCategory;
  onSelect: (category: MealCategory) => void;
}

function MealCategoryCard({ category, onSelect }: MealCategoryCardProps) {
  return (
    <div
      className="group relative flex-shrink-0 cursor-pointer"
      style={{ scrollSnapAlign: 'start' }}
      onClick={() => onSelect(category)}
    >
      <div className="relative w-48 h-32 rounded-lg overflow-hidden transition-transform group-hover:scale-105">
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 192px, 192px"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <h3 className="text-white font-semibold text-lg drop-shadow-lg">
            {category.name}
          </h3>
          <p className="text-white/90 text-sm drop-shadow-lg">
            {category.description}
          </p>
        </div>
      </div>
    </div>
  );
} 