"use client";

import { AddItemDialog } from "@/features/grocery/components/add-item-dialog";
import { RecentGroceriesDialog } from "@/features/grocery/components/recent-groceries-dialog";
import { SmartShoppingSummary } from "@/features/grocery/components/smart-shopping-summary";
import { useUser } from "@/hooks/use-user";
import { getFoodRequests } from "@/lib/supabase/actions";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Check, ChevronDown, ChevronUp, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { GroceryItem } from "@/types/grocery";



// Type for AI suggestions from localStorage
interface AISuggestion {
  name?: string;
  item_name?: string;
  category?: string;
  section?: string;
  quantity?: number;
  unit?: string;
  units?: string;
  cookingUses?: string[];
  cooking_uses?: string[];
  storageTips?: string;
  storage_tips?: string;
  nutritionalHighlights?: string[];
  nutritional_highlights?: string[];
}

// Available units for dropdown
const UNITS = [
  'pcs', 'lbs', 'oz', 'kg', 'g', 'cups', 'tbsp', 'tsp', 'bottles', 'cans', 'boxes', 'bags', 'bunches', 'loaves'
];

// Household colors for consistent tagging
const HOUSEHOLD_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 
  'bg-teal-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-cyan-500'
];

// Store sections for category selection
const STORE_SECTIONS = [
  'Produce', 'Dairy', 'Meat', 'Bakery', 'Snacks', 'Canned Goods', 'Dry Goods', 'Beverages', 'Personal', 'Household'
];

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItems, setEditingItems] = useState<Set<string>>(new Set());
  const [editingData, setEditingData] = useState<Record<string, Partial<GroceryItem>>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [householdColors, setHouseholdColors] = useState<Record<string, string>>({});
  const { user } = useUser();
  const supabase = createClient();

  // Sort & Filter state
  const [sortBy, setSortBy] = useState<'household' | 'priority' | 'quantity' | 'requester' | 'category' | 'store'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const [recentItems, setRecentItems] = useState<GroceryItem[]>([]);
  const [showRecentDialog, setShowRecentDialog] = useState(false);

  // Get unique sections from items
  const sections = ['all', ...new Set(items.filter(item => item.section).map(item => item.section as string))];

  // Memoize the smart summary items to prevent recalculation on sorting/filtering
  const smartSummaryItems = useMemo(() => {
    const unpurchasedItems = items.filter(item => !item.is_purchased);
    return unpurchasedItems.map(item => ({
      ...item,
      name: item.item_name,
      category: item.section || 'Uncategorized'
    }));
  }, [items]);

  // Get household color based on saved color or default hash
  const getHouseholdColor = (householdName: string) => {
    // Check if we have a custom color for this household
    const customColor = householdColors[householdName];
    if (customColor) {
      return customColor;
    }
    
    // Default hash-based color if no custom color is set
    const hash = householdName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return HOUSEHOLD_COLORS[Math.abs(hash) % HOUSEHOLD_COLORS.length];
  };

  const loadGroceryList = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getFoodRequests(user.id);
      setItems(data as unknown as GroceryItem[]);
    } catch (error) {
      console.error('Error loading grocery list:', error);
      toast.error('Failed to load grocery list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadHouseholdColors = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data: households, error } = await supabase
        .from('households')
        .select('name, color')
        .eq('created_by', user.id);

      if (error) throw error;

      const colorMap: Record<string, string> = {};
      households?.forEach((household: { name: string; color?: string | null }) => {
        if (household.color) {
          colorMap[household.name] = household.color;
        }
      });
      
      setHouseholdColors(colorMap);
    } catch (error) {
      console.error('Error loading household colors:', error);
    }
  }, [user?.id, supabase]);

  const loadGroceryListAndSuggestions = useCallback(async () => {
    // First load the existing grocery list
    await loadGroceryList();
    
    // Then check for AI suggestions and add them
    const suggestions = localStorage.getItem('grocerySuggestions');
    if (suggestions) {
      try {
        console.log('Found AI suggestions in localStorage:', suggestions);
        const parsedSuggestions = JSON.parse(suggestions);
        // Handle both legacy format with items property and new direct array format
        const suggestionsArray = Array.isArray(parsedSuggestions) ? parsedSuggestions : (parsedSuggestions.items || []);
        
        console.log('Processed suggestions array:', suggestionsArray);
        
        if (suggestionsArray.length > 0) {
          // Convert AI suggestions to GroceryItem format
          const newItems = suggestionsArray.map((suggestion: unknown) => {
            // Type guard to ensure we're working with the right shape
            const aiSuggestion = suggestion as AISuggestion;
            
            const name = aiSuggestion.name || aiSuggestion.item_name || 'Unknown Item';
            const category = aiSuggestion.category || aiSuggestion.section || null;
            const quantity = aiSuggestion.quantity ?? 1;
            const unit = aiSuggestion.unit || aiSuggestion.units || null;
            const cookingUses = Array.isArray(aiSuggestion.cookingUses) 
              ? aiSuggestion.cookingUses 
              : (aiSuggestion.cooking_uses || []);
            const storageTips = aiSuggestion.storageTips || aiSuggestion.storage_tips || '';
            const nutritionalHighlights = Array.isArray(aiSuggestion.nutritionalHighlights) 
              ? aiSuggestion.nutritionalHighlights 
              : (aiSuggestion.nutritional_highlights || []);

            return {
              id: crypto.randomUUID(), // Generate unique UUID IDs
              name: 'AI Suggested',
              category: category,
              item_name: name,
              item_description: `${cookingUses.join(', ')}. Storage: ${storageTips}. Nutrition: ${nutritionalHighlights.join(', ')}`,
              quantity,
              unit,
              priority: 'normal' as const,
              section: category,
              household: { name: 'AI Suggested' },
              requester: { full_name: 'AI Assistant' },
              approver: null,
              is_purchased: false,
              is_accepted: false,
              status: 'pending' as const
            } as GroceryItem;
          });
          
          console.log('Generated new items:', newItems);
          
          // Add AI suggestions to the list
          setItems(prev => {
            console.log('Previous items:', prev.length);
            const updatedItems = [...prev, ...newItems];
            console.log('Updated items:', updatedItems.length);
            return updatedItems;
          });
          
          toast.success(`${newItems.length} AI suggestions added to your list!`);
        } else {
          console.log('No suggestions in array');
        }
        
        // Clear suggestions from localStorage
        localStorage.removeItem('grocerySuggestions');
      } catch (error) {
        console.error('Error processing AI suggestions:', error);
        toast.error('Failed to process AI suggestions');
      }
    } else {
      console.log('No AI suggestions found in localStorage');
    }
  }, [loadGroceryList]);

  useEffect(() => {
    if (user?.id) {
      loadGroceryListAndSuggestions();
      loadHouseholdColors();
    }
  }, [user?.id, loadGroceryListAndSuggestions, loadHouseholdColors]);

  useEffect(() => {
    const saved = localStorage.getItem('recentGroceries');
    if (saved) {
      try { setRecentItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  const toggleItemPurchased = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Only allow toggling if the item has been accepted
    if (!item.is_accepted && item.status !== 'approved') {
      toast.error("You must accept this item before marking it as purchased");
      return;
    }

    try {
      const newPurchasedState = !item.is_purchased;
      
      // Update in database
      const { error } = await supabase
        .from('food_requests')
        .update({ 
          is_purchased: newPurchasedState,
          purchased_at: newPurchasedState ? new Date().toISOString() : null
        })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(i => 
        i.id === itemId 
          ? { ...i, is_purchased: newPurchasedState }
          : i
      ));

      toast.success(newPurchasedState ? 'Item marked as purchased' : 'Item unmarked as purchased');
    } catch (error) {
      console.error('Error updating purchased status:', error);
      toast.error('Failed to update item status');
    }
  };

  const handleItemPreference = async (itemId: string, itemName: string, section: string | null, preferenceType: 'accept' | 'reject') => {
    try {
      if (!user?.id) {
        toast.error('Please sign in to update preferences');
        return;
      }

      if (preferenceType === 'accept') {
        // Update the food request to mark as accepted
        const { error: updateError } = await supabase
          .from('food_requests')
          .update({
            is_accepted: true,
            accepted_by: user.id,
            accepted_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (updateError) throw updateError;

        // Update local state
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, is_accepted: true }
            : item
        ));

        toast.success('Item accepted');
      } else {
        // For reject, remove item from list and update database
        const { error: updateError } = await supabase
          .from('food_requests')
          .update({
            status: 'declined'
          })
          .eq('id', itemId);

        if (updateError) throw updateError;

        // Remove from local state
        setItems(prev => prev.filter(item => item.id !== itemId));
        
        toast.success('Item rejected');
      }

      // Also save preference for future suggestions
      const { error: prefError } = await supabase
        .from('item_preferences')
        .upsert({
          user_id: user.id,
          item_name: itemName,
          section,
          preference_type: preferenceType
        }, {
          onConflict: 'user_id,item_name'
        });

      if (prefError) {
        console.error('Error saving preference:', prefError);
        // Don't show error to user as the main action succeeded
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error updating item preference:', error);
      toast.error(`Failed to update preference: ${msg}`);
    }
  };

  const startEditing = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditingItems(prev => new Set(prev).add(itemId));
      setEditingData(prev => ({
        ...prev,
        [itemId]: {
          item_name: (item.item_name ?? item.name ?? ""),
          item_description: item.item_description,
          quantity: item.quantity,
          unit: item.unit,
          priority: item.priority,
          section: item.section
        }
      }));
    }
  };

  const cancelEditing = (itemId: string) => {
    setEditingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    setEditingData(prev => {
      const newData = { ...prev };
      delete newData[itemId];
      return newData;
    });
  };

  const saveEdit = async (itemId: string) => {
    try {
      const editData = editingData[itemId];
      if (!editData) return;

      // Update in database
      const { error } = await supabase
        .from('food_requests')
        .update({
          item_name: editData.item_name,
          item_description: editData.item_description,
          quantity: editData.quantity,
          unit: editData.unit,
          priority: editData.priority,
          section: editData.section
        })
        .eq('id', itemId);

      if (error) throw error;

      // Update the item in the local state
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, ...editData }
          : item
      ));

      // Stop editing
      cancelEditing(itemId);
      
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('food_requests')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const clearAllPurchased = async () => {
    try {
      const purchasedItems = items.filter(item => item.is_purchased);
      const purchasedIds = purchasedItems.map(item => item.id);

      if (purchasedIds.length === 0) return;

      // Soft delete in DB
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('food_requests')
        .update({ deleted_at: now })
        .in('id', purchasedIds);
      if (error) throw error;

      // Update local state - remove from items
      setItems(prev => prev.filter(item => !purchasedIds.includes(item.id)));

      // Update recent items (max 30)
      const updatedRecent = [...purchasedItems, ...recentItems].slice(0, 30);
      setRecentItems(updatedRecent);
      localStorage.setItem('recentGroceries', JSON.stringify(updatedRecent));

      toast.success('Purchased items moved to recent');
    } catch (error) {
      console.error('Error clearing purchased items:', error);
      toast.error('Failed to clear purchased items');
    }
  };

  const updateEditingData = (itemId: string, field: string, value: unknown) => {
    setEditingData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
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

  // Sort & Filter logic
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
        case 'category':
          const ca = a.section ?? 'Uncategorized';
          const cb = b.section ?? 'Uncategorized';
          comparison = ca.localeCompare(cb);
          break;
        case 'store':
          // For now, sort by section since we don't have separate store data
          const sa = a.section ?? 'Uncategorized';
          const sb = b.section ?? 'Uncategorized';
          comparison = sa.localeCompare(sb);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'desc' ? comparison : -comparison;
    });
  };

  const purchasedItemsList = items.filter(item => item.is_purchased);

  // Only sort the display lists, keep original items for optimization
  const sortedUnpurchased = filterAndSortItems(items.filter(item => !item.is_purchased));
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
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No items in your grocery list. Add some food requests from your households!
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Smart Shopping Summary - Pass memoized items that won't change on sort/filter */}
          <SmartShoppingSummary items={smartSummaryItems} />

          {/* Unpurchased Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">To Buy</h2>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowRecentDialog(true)} className="ml-2 text-muted-foreground">
                  Recent Groceries
                </Button>
              </div>
              <div className="flex items-center gap-4">
                {/* Section Filter */}
                <div className="flex items-center gap-2">
                  <Select value={sectionFilter} onValueChange={setSectionFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {sections.filter(s => s !== 'all').map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <Select value={sortBy} onValueChange={(val: string) => setSortBy(val as 'priority' | 'household' | 'quantity' | 'requester' | 'category')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">Urgency</SelectItem>
                      <SelectItem value="household">Household</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="requester">Requested By</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
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
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={item.is_purchased || false}
                      onCheckedChange={() => toggleItemPurchased(item.id)}
                      disabled={!item.is_accepted && item.status !== 'approved'}
                      title={!item.is_accepted && item.status !== 'approved' ? "Accept this item before marking as purchased" : ""}
                    />
                    <div className="flex-1">
                      {editingItems.has(item.id) ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              value={editingData[item.id]?.item_name || ''}
                              onChange={(e) => updateEditingData(item.id, 'item_name', e.target.value)}
                              className="flex-1 min-w-40"
                              placeholder="Item name"
                            />
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editingData[item.id]?.quantity || 0}
                                onChange={(e) => updateEditingData(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-20"
                                placeholder="Qty"
                              />
                              <Select
                                value={editingData[item.id]?.unit || ''}
                                onValueChange={(value) => updateEditingData(item.id, 'unit', value)}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNITS.map((unit) => (
                                    <SelectItem key={unit} value={unit}>
                                      {unit}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Select
                              value={editingData[item.id]?.priority || 'normal'}
                              onValueChange={(value) => updateEditingData(item.id, 'priority', value)}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Select
                            value={editingData[item.id]?.section || ''}
                            onValueChange={(value) => updateEditingData(item.id, 'section', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {STORE_SECTIONS.map((section) => (
                                <SelectItem key={section} value={section}>
                                  {section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={editingData[item.id]?.item_description || ''}
                            onChange={(e) => updateEditingData(item.id, 'item_description', e.target.value)}
                            placeholder="Description (optional)"
                            className="w-full"
                          />
                        </div>
                      ) : (
                        // View mode
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{item.item_name}</span>
                            <Badge 
                              className={`text-white ${getHouseholdColor(item.household.name)}`}
                            >
                              {item.household.name}
                            </Badge>
                            {item.priority === 'urgent' && (
                              <Badge variant="destructive">Urgent</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} • {item.section || 'Uncategorized'} • 
                            Requested by {item.requester.full_name}
                          </div>
                          {item.item_description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {item.item_description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingItems.has(item.id) ? (
                      // Edit mode buttons
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => saveEdit(item.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelEditing(item.id)}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (item.is_accepted || item.status === 'approved') ? (
                      // Edit and delete buttons for accepted items
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEditing(item.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteItem(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      // Accept/Reject buttons for new items
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleItemPreference(item.id, (item.item_name ?? item.name ?? ""), item.section || null, 'accept')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleItemPreference(item.id, (item.item_name ?? item.name ?? ""), item.section || null, 'reject')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
                  onClick={clearAllPurchased}
                >
                  Clear All
                </Button>
              </div>
              {sortedPurchased.map((item) => (
                <Card key={item.id} className="p-4 bg-muted">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={item.is_purchased || false}
                      onCheckedChange={() => toggleItemPurchased(item.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-through">{item.item_name}</h3>
                          <Badge 
                            className={`text-white ${getHouseholdColor(item.household.name)}`}
                          >
                            {item.household.name}
                          </Badge>
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

      <RecentGroceriesDialog 
        isOpen={showRecentDialog} 
        onClose={() => setShowRecentDialog(false)} 
        items={recentItems}
        onReAdd={() => loadGroceryList()}
      />
    </div>
  );
} 