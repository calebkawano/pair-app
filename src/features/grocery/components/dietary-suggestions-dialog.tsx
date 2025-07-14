import { logger } from "@/lib/logger";
import { useActiveHousehold, useSupabase } from "@/lib/use-supabase";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface DietarySuggestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    priceRange: string;
    cookingUses: string[];
    storageTips: string;
    nutritionalHighlights: string[];
  }>;
}

export function DietarySuggestionsDialog({
  isOpen,
  onClose,
  suggestions,
}: DietarySuggestionsDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabase();
  const householdId = useActiveHousehold();

  // Debug logging for household ID resolution
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      logger.info({ householdId, isOpen }, 'DietarySuggestionsDialog household state');
    }
  }, [householdId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Set());
    }
  }, [isOpen, suggestions]);

  const toggleItem = (index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddToList = async () => {
    if (!householdId) {
      toast.error('Unable to determine active household. Please try refreshing the page or check your household membership.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to add items');
        return;
      }

      // Allowed store sections as per food_requests constraint
      const ALLOWED_SECTIONS = [
        'Produce',
        'Meat & Seafood',
        'Dairy & Eggs',
        'Bakery',
        'Pantry',
        'Frozen',
        'Beverages',
        'Household',
        'Other'
      ];

      const normalizeSection = (raw: string | null) => {
        if (!raw) return null;
        const found = ALLOWED_SECTIONS.find(sec => sec.toLowerCase() === raw.toLowerCase());
        return found || 'Other';
      };

      // Get selected suggestions
      const householdIdValue = householdId; // food_requests expects UUID

      const itemsToAdd = Array.from(selectedItems).map(index => {
        const suggestion = suggestions[index];
        return {
          household_id: householdIdValue,
          requested_by: user.id,
          item_name: suggestion.name,
          item_description: `Cooking uses: ${suggestion.cookingUses.join(', ')}. Storage: ${suggestion.storageTips}. Nutrition: ${suggestion.nutritionalHighlights.join(', ')}`,
          quantity: suggestion.quantity,
          unit: suggestion.unit,
          status: 'pending',
          section: normalizeSection(suggestion.category),
          priority: 'normal',
          is_manual: true,
        };
      });

      if (process.env.NODE_ENV !== 'production') {
        logger.info({ items: itemsToAdd }, 'Adding suggestions as food requests');
      }

      // Add items to food_requests
      const { error, data } = await supabase
        .from('food_requests')
        .insert(itemsToAdd)
        .select();

      if (error) {
        logger.error({
          error,
          details: {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        }, 'Failed to insert food requests');
        throw error;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info({ data }, 'Successfully inserted food requests');
      }

      toast.success(`${selectedItems.size} items added to your grocery list`);
      onClose();
    } catch (error) {
      logger.error({ error }, 'Failed to add items to grocery list');
      toast.error('Failed to add items to your list');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggested Items</DialogTitle>
          <DialogDescription>
            Based on your dietary preferences, here are some suggested items for your grocery list.
            Select the items you&apos;d like to add.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {suggestions.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/5"
            >
              <Checkbox
                checked={selectedItems.has(index)}
                onCheckedChange={() => toggleItem(index)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">{item.name}</h3>
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant="secondary">
                    {item.quantity} {item.unit}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <p><strong>Uses:</strong> {item.cookingUses.join(', ')}</p>
                  <p><strong>Storage:</strong> {item.storageTips}</p>
                  <p><strong>Nutrition:</strong> {item.nutritionalHighlights.join(', ')}</p>
                  <p><strong>Price Range:</strong> {item.priceRange}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {householdId === null && (
            <div className="text-sm text-muted-foreground mr-4">
              Unable to find your household. Please check your membership status.
            </div>
          )}
          <Button 
            onClick={handleAddToList} 
            disabled={isSubmitting || selectedItems.size === 0 || householdId === null}
          >
            {isSubmitting
              ? 'Adding...'
              : householdId === null
                ? 'No Household Found'
                : `Add ${selectedItems.size} Item${selectedItems.size === 1 ? '' : 's'} to List`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 