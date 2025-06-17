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
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Check, ChevronDown, ChevronUp, Edit2, Plus, Save, Trash2, X } from "lucide-react";
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
    color?: string;
  };
  requester: {
    full_name: string;
  };
  approver: {
    full_name: string;
  } | null;
  is_purchased?: boolean;
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
  const [purchasedItems, setPurchasedItems] = useState<Set<number>>(new Set());
  const [acceptedItems, setAcceptedItems] = useState<Set<number>>(new Set());
  const [editingItems, setEditingItems] = useState<Set<number>>(new Set());
  const [editingData, setEditingData] = useState<Record<number, Partial<GroceryItem>>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [householdColors, setHouseholdColors] = useState<Record<string, string>>({});
  const { user } = useUser();
  const supabase = createClient();

  // Sort & Filter state
  const [sortBy, setSortBy] = useState<'household' | 'priority' | 'quantity' | 'requester'>('priority');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  // Get unique sections from items
  const sections = ['all', ...new Set(items.filter(item => item.section).map(item => item.section as string))];

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

  useEffect(() => {
    if (user?.id) {
      loadGroceryList();
      loadHouseholdColors();
      
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

  const loadHouseholdColors = async () => {
    if (!user?.id) return;
    
    try {
      const { data: households, error } = await supabase
        .from('households')
        .select('name, color')
        .eq('created_by', user.id);

      if (error) throw error;

      const colorMap: Record<string, string> = {};
      households?.forEach(household => {
        if (household.color) {
          colorMap[household.name] = household.color;
        }
      });
      
      setHouseholdColors(colorMap);
    } catch (error) {
      console.error('Error loading household colors:', error);
    }
  };

  const toggleItemPurchased = (itemId: number) => {
    // Only allow toggling if the item has been accepted
    const item = items.find(i => i.id === itemId);
    if (!item || (!acceptedItems.has(itemId) && !item.approver)) {
      toast.error("You must accept this item before marking it as purchased");
      return;
    }

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
        // Mark item as accepted so buttons disappear
        setAcceptedItems(prev => new Set(prev).add(itemId));
      } else {
        // Remove item from list for rejected
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

  const startEditing = (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setEditingItems(prev => new Set(prev).add(itemId));
      setEditingData(prev => ({
        ...prev,
        [itemId]: {
          item_name: item.item_name,
          item_description: item.item_description,
          quantity: item.quantity,
          unit: item.unit,
          priority: item.priority,
          section: item.section
        }
      }));
    }
  };

  const cancelEditing = (itemId: number) => {
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

  const saveEdit = async (itemId: number) => {
    try {
      const editData = editingData[itemId];
      if (!editData) return;

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

  const deleteItem = async (itemId: number) => {
    try {
      // Remove from local state
      setItems(prev => prev.filter(item => item.id !== itemId));
      setAcceptedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setPurchasedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const updateEditingData = (itemId: number, field: string, value: any) => {
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
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={purchasedItems.has(item.id)}
                      onCheckedChange={() => toggleItemPurchased(item.id)}
                      disabled={!acceptedItems.has(item.id) && !item.approver}
                      title={!acceptedItems.has(item.id) && !item.approver ? "Accept this item before marking as purchased" : ""}
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
                    ) : acceptedItems.has(item.id) || item.approver ? (
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
                      disabled={!acceptedItems.has(item.id) && !item.approver}
                      title={!acceptedItems.has(item.id) && !item.approver ? "Accept this item before marking as purchased" : ""}
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
    </div>
  );
} 