"use client";

import { AddItemDialog } from "@/features/grocery/components/add-item-dialog";
import { SmartShoppingSummary } from "@/features/grocery/components/smart-shopping-summary";
import { useUser } from "@/hooks/use-user";
import { getFoodRequests } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GroceryItem {
  id: number;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit: string | null;
  priority: 'urgent' | 'normal';
  section?: string | null;
  household: {
    name: string;
  };
  requester: {
    full_name: string;
  };
  approver: {
    full_name: string;
  } | null;
  is_purchased?: boolean;
}

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedItems, setPurchasedItems] = useState<Set<number>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user } = useUser();
  const supabase = createClient();

  // Sort & Filter state
  const [sortBy, setSortBy] = useState<'household' | 'priority' | 'quantity' | 'requester'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Get unique sections from items
  const sections = ['all', ...new Set(items.filter(item => item.section).map(item => item.section as string))];

  useEffect(() => {
    if (user?.id) {
      loadGroceryList();
      
      // Check for AI suggestions
      const suggestions = localStorage.getItem('grocerySuggestions');
      if (suggestions) {
        try {
          const parsedSuggestions = JSON.parse(suggestions);
          // Convert AI suggestions to GroceryItem format
          const newItems = parsedSuggestions.map((suggestion: any, index: number) => ({
            id: Date.now() + index, // Generate unique IDs
            item_name: suggestion.name,
            item_description: `${suggestion.cookingUses.join(', ')}. Storage: ${suggestion.storageTips}. Nutrition: ${suggestion.nutritionalHighlights.join(', ')}`,
            quantity: suggestion.quantity,
            unit: suggestion.unit,
            priority: 'normal',
            section: suggestion.category,
            household: {
              name: 'AI Suggested'
            },
            requester: {
              full_name: 'AI Assistant'
            },
            approver: null,
            is_purchased: false
          }));
          
          // Add AI suggestions to the list
          setItems(prev => [...prev, ...newItems]);
          
          // Clear suggestions from localStorage
          localStorage.removeItem('grocerySuggestions');
          
          toast.success('AI suggestions added to your list!');
        } catch (error) {
          console.error('Error processing AI suggestions:', error);
          toast.error('Failed to process AI suggestions');
        }
      }
    }
  }, [user]);

  const loadGroceryList = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getFoodRequests(user.id);
      setItems(data as GroceryItem[]);
    } catch (error) {
      console.error('Error loading grocery list:', error);
      toast.error('Failed to load grocery list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemPurchased = (itemId: number) => {
    setPurchasedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleItemPreference = async (itemId: number, itemName: string, section: string | null, preferenceType: 'accept' | 'reject') => {
    try {
      if (!user?.id) {
        toast.error('Please sign in to update preferences');
        return;
      }

      console.log('Updating preference:', {
        user_id: user.id,
        item_name: itemName,
        section,
        preference_type: preferenceType
      });

      const { data, error } = await supabase
        .from('item_preferences')
        .upsert({
          user_id: user.id,
          item_name: itemName,
          section,
          preference_type: preferenceType
        }, {
          onConflict: 'user_id,item_name'
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Preference updated:', data);

      // Update UI based on preference
      if (preferenceType === 'accept') {
        // Move item to accepted list
        setPurchasedItems(prev => new Set(prev).add(itemId));
      } else {
        // Remove item from list
        setItems(prev => prev.filter(item => item.id !== itemId));
      }

      toast.success(`Item ${preferenceType === 'accept' ? 'accepted' : 'rejected'}`);
    } catch (error: any) {
      console.error('Error updating item preference:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      toast.error(`Failed to update preference: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading grocery list...
        </div>
      </div>
    );
  }

  const unpurchasedItems = items.filter(item => !purchasedItems.has(item.id));
  const purchasedItemsList = items.filter(item => purchasedItems.has(item.id));

  // Filter & Sort logic
  const filterAndSortItems = (items: GroceryItem[]) => {
    let filtered = items;
    
    // Apply section filter
    if (sectionFilter !== 'all') {
      filtered = filtered.filter(item => item.section === sectionFilter);
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'household':
          comparison = a.household.name.localeCompare(b.household.name);
          break;
        case 'quantity':
          comparison = (a.quantity ?? 0) - (b.quantity ?? 0);
          break;
        case 'requester':
          comparison = a.requester.full_name.localeCompare(b.requester.full_name);
          break;
        case 'priority':
          const pa = a.priority ?? 'normal';
          const pb = b.priority ?? 'normal';
          comparison = pa === pb ? 0 : pa === 'urgent' ? -1 : 1;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'desc' ? comparison : -comparison;
    });
  };

  const sortedUnpurchased = filterAndSortItems(unpurchasedItems);
  const sortedPurchased = filterAndSortItems(purchasedItemsList);

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Grocery List</h1>
          <p className="text-muted-foreground">
            Manage your household grocery shopping list. Check off items as you buy them.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No items in your grocery list. Add some food requests from your households!
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Smart Shopping Summary */}
          <SmartShoppingSummary items={unpurchasedItems} />

          {/* Unpurchased Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">To Buy</h2>
              <div className="flex items-center gap-4">
                {/* Section Filter */}
                <div className="flex items-center gap-2">
                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section === 'all' ? 'All Sections' : section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(val: string) => setSortBy(val as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Urgency</SelectItem>
                      <SelectItem value="household">Household</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="requester">Requested By</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="h-10 w-10"
                  >
                    {sortDirection === 'desc' ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {sortedUnpurchased.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={purchasedItems.has(item.id)}
                      onCheckedChange={() => toggleItemPurchased(item.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.item_name}</span>
                        {item.priority === 'urgent' && (
                          <Badge variant="destructive">Urgent</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} • {item.section || 'Uncategorized'} • 
                        Requested by {item.requester.full_name} for {item.household.name}
                      </div>
                    </div>
                  </div>

                  {/* Accept/Reject buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemPreference(item.id, item.item_name, item.section || null, 'accept')}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleItemPreference(item.id, item.item_name, item.section || null, 'reject')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Purchased Items */}
          {purchasedItemsList.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Purchased</h2>
                <Button
                  variant="outline"
                  onClick={() => setPurchasedItems(new Set())}
                >
                  Clear All
                </Button>
              </div>
              {sortedPurchased.map((item) => (
                <Card key={item.id} className="p-4 bg-muted">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={purchasedItems.has(item.id)}
                      onCheckedChange={() => toggleItemPurchased(item.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-through">{item.item_name}</h3>
                          <Badge variant="outline">{item.household.name}</Badge>
                        </div>
                        {/* Priority Badge moved to right */}
                        <span
                          className={`px-1.5 py-0.5 text-xs font-bold rounded text-white ${
                            item.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                        >
                          {item.priority === 'urgent' ? 'U' : 'R'}
                        </span>
                      </div>
                      {item.item_description && (
                        <p className="text-sm text-muted-foreground line-through">
                          {item.item_description}
                        </p>
                      )}
                      <p className="text-sm line-through">
                        Quantity: {item.quantity} {item.unit || 'units'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested by {item.requester.full_name}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <AddItemDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onItemAdded={() => loadGroceryList()}
      />
    </div>
  );
} 