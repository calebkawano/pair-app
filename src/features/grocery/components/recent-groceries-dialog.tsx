"use client";

import { useMemo, useState } from "react";
import { GroceryItem } from "@/types/grocery";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { useActiveHousehold } from "@/lib/use-supabase";
import { toast } from "sonner";

interface RecentGroceriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: GroceryItem[];
  onReAdd?: () => void;
}

export function RecentGroceriesDialog({ isOpen, onClose, items, onReAdd }: RecentGroceriesDialogProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);
  const supabase = createClient();
  const householdId = useActiveHousehold();

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getConciseName = (full: string | undefined): string => {
    if (!full) return "";
    const cleaned = full
      .replace(/\([^)]*\)/g, "") // remove parentheticals
      .replace(/\b(original|premium|brand|label|fresh|grade\s*[a-z])\b/gi, "") // drop common marketing terms
      .replace(/\s+/g, " ")
      .trim();
    const words = cleaned.split(" ");
    if (words.length <= 3) return cleaned;
    return words.slice(-2).join(" ");
  };

  const readdItem = async (item: GroceryItem) => {
    try {
      setAddingId(item.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }
      if (!householdId) {
        toast.error('No active household selected');
        return;
      }

      const insertData = {
        household_id: householdId,
        requested_by: user.id,
        item_name: (item.item_name ?? item.name ?? '').trim(),
        item_description: item.item_description || null,
        quantity: item.quantity ?? 1,
        unit: item.unit || null,
        section: item.section || null,
        priority: item.priority ?? 'normal',
        status: 'approved' as const,
        is_manual: true,
      };

      const { error } = await supabase
        .from('food_requests')
        .insert([insertData]);

      if (error) throw error;

      toast.success(`${insertData.item_name} re-added to your list`);
      onReAdd?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to re-add item';
      toast.error(message);
    } finally {
      setAddingId(null);
    }
  };

  const orderedItems = useMemo(() => items, [items]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recently Bought Items</DialogTitle>
          <DialogDescription>
            The last 30 items you cleared from your cart
          </DialogDescription>
        </DialogHeader>

        {orderedItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recent items yet.</p>
        ) : (
          <div className="space-y-2">
            {orderedItems.map((item) => {
              const concise = getConciseName(item.item_name ?? item.name);
              const qtyPart = [item.quantity, item.unit].filter(Boolean).join(' ');
              const summary = [qtyPart, concise].filter(Boolean).join(', ');
              const isExpanded = expandedIds.has(item.id);
              return (
                <div key={item.id} className="p-3 border rounded-lg bg-card">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div>
                      <p className="font-medium">{summary || (item.item_name ?? item.name)}</p>
                      <div className="text-sm text-muted-foreground">
                        {item.section || 'Uncategorized'}
                      </div>
                    </div>
                    <Badge variant="secondary">Cleared</Badge>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Full name</div>
                        <div className="font-medium">{item.item_name ?? item.name}</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Quantity</div>
                          <div>{item.quantity} {item.unit || ''}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Category</div>
                          <div>{item.section || 'Uncategorized'}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-muted-foreground">Household</div>
                          <div className="mt-1">
                            <Badge
                              title={item.household.name}
                              className="text-white max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
                            >
                              {item.household.name}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Priority</div>
                          <div>{item.priority === 'urgent' ? 'Urgent' : 'Normal'}</div>
                        </div>
                      </div>
                      {item.item_description && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Notes</div>
                          <div className="text-sm whitespace-pre-line">{item.item_description}</div>
                        </div>
                      )}

                      <div className="pt-1 text-right">
                        <Button onClick={() => readdItem(item)} disabled={addingId === item.id} variant="outline">
                          {addingId === item.id ? 'Re-adding…' : 'Re-add to List'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 