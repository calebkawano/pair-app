import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
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
  dietaryPreferences: {
    dietaryGoal: string;
    favoriteFood: string;
    cookingTime: string;
    servingCount: string;
  };
}

export function DietarySuggestionsDialog({
  isOpen,
  onClose,
  suggestions,
  dietaryPreferences,
}: DietarySuggestionsDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personalHouseholdId, setPersonalHouseholdId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    getPersonalHousehold();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Set());
    }
  }, [isOpen, suggestions]);

  const getPersonalHousehold = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      // 1. Try household_members first
      const { data: memberRow, error: memberErr } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (memberRow?.household_id) {
        if (process.env.NODE_ENV !== 'production') {
          logger.info({ householdId: memberRow.household_id }, 'Found household via membership');
        }
        setPersonalHouseholdId(memberRow.household_id as string);
      } else {
        if (memberErr && memberErr.code !== 'PGRST116') {
          logger.error({ error: memberErr }, 'Failed to query household members');
        }
        // 2. Fallback: try personal household by created_by
        const { data: personalHousehold, error: personalError } = await supabase
          .from('households')
          .select('id')
          .eq('created_by', user.id)
          .eq('is_personal', true)
          .single();

        if (personalHousehold?.id) {
          if (process.env.NODE_ENV !== 'production') {
            logger.info({ householdId: personalHousehold.id }, 'Using personal household');
          }
          setPersonalHouseholdId(personalHousehold.id);
        } else {
          logger.warn({ userId: user.id }, 'No household found for user');
          toast.error('No household found. Please join or create one.');
        }
      }

      // Save dietary preferences (update all membership rows)
      if (dietaryPreferences) {
        const { error: prefsError } = await supabase
          .from('household_members')
          .update({ dietary_preferences: dietaryPreferences })
          .eq('user_id', user.id);

        if (prefsError) {
          logger.error({ error: prefsError }, 'Failed to save dietary preferences');
          toast.error('Failed to save dietary preferences');
        }
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to get personal household');
      toast.error(error.message || 'Failed to find your household');
    }
  };

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
    if (!personalHouseholdId) {
      toast.error('Unable to find your personal household');
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
      const householdIdValue = personalHouseholdId; // food_requests expects UUID

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
            Select the items you'd like to add.
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
          <Button 
            onClick={handleAddToList} 
            disabled={isSubmitting || selectedItems.size === 0 || !personalHouseholdId}
          >
            {isSubmitting
              ? 'Adding...'
              : !personalHouseholdId
                ? 'Loading...'
                : `Add ${selectedItems.size} Item${selectedItems.size === 1 ? '' : 's'} to List`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 