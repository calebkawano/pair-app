'use client';

import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeCarouselProps {
  children: React.ReactNode;
}

const pages = [
  { path: '/dashboard/grocery', name: 'Grocery' },
  { path: '/dashboard/meals', name: 'Meals' },
  { path: '/dashboard', name: 'Profile' }
];

export function SwipeCarousel({ children }: SwipeCarouselProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const x = useMotionValue(0);
  const dragConstraints = { left: -50, right: 50 };

  // Find current page index
  useEffect(() => {
    const index = pages.findIndex(page => page.path === pathname);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [pathname]);

  // Show hint for new users
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('dashboard-swipe-hint-seen');
    if (!hasSeenHint && !hasInteracted) {
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 2000); // Show hint after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  // Hide hint after 5 seconds or interaction
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('dashboard-swipe-hint-seen', 'true');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showHint]);

  const navigateToPage = useCallback((direction: 'left' | 'right') => {
    if (isTransitioning) return;
    
    setHasInteracted(true);
    setShowHint(false);
    setIsTransitioning(true);
    
    let newIndex;
    if (direction === 'left') {
      // Swipe left = go to previous page (circular)
      newIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    } else {
      // Swipe right = go to next page (circular)
      newIndex = currentIndex === pages.length - 1 ? 0 : currentIndex + 1;
    }
    
    // Navigate immediately and let the page transition handle the animation
    router.push(pages[newIndex].path);
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      x.set(0);
    }, 300);
  }, [currentIndex, router, x, isTransitioning]);

  const handleDragEnd = (event: PointerEvent, info: PanInfo) => {
    const threshold = 50;
    
    if (Math.abs(info.offset.x) > threshold) {
      if (info.offset.x > 0) {
        navigateToPage('left');
      } else {
        navigateToPage('right');
      }
    } else {
      // Snap back to center
      x.set(0);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateToPage('left');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateToPage('right');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigateToPage]);

  const handleInteraction = () => {
    setHasInteracted(true);
    setShowHint(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="w-full h-full"
          style={{ x }}
          drag="x"
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          onDragStart={handleInteraction}
          onDragEnd={handleDragEnd}
          onTap={handleInteraction}
          initial={{ x: isTransitioning ? (currentIndex === 0 && pathname === pages[pages.length - 1].path ? -300 : 300) : 0, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isTransitioning ? (currentIndex === pages.length - 1 && pathname === pages[0].path ? 300 : -300) : 0, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Swipe Hint */}
      {showHint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40"
        >
          <div className="bg-black/80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 backdrop-blur-sm">
            <ChevronLeft className="h-4 w-4 animate-pulse" />
            <span>Swipe to navigate</span>
            <ChevronRight className="h-4 w-4 animate-pulse" />
          </div>
        </motion.div>
      )}

      {/* Page indicators */}
      <div className="fixed bottom-18 left-1/2 transform -translate-x-1/2 z-30 flex gap-2">
        {pages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
