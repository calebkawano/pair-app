'use client';

import { PRIORITY_LEVELS, STORE_SECTIONS } from '@/constants/store';
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { useActiveHousehold } from "@/lib/use-supabase";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Textarea } from "@/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

// Available units for dropdown - matching the main grocery page
const UNITS = [
  'pcs', 'lbs', 'oz', 'kg', 'g', 'cups', 'tbsp', 'tsp', 'bottles', 'cans', 'boxes', 'bags', 'loaves'
];

interface SuggestedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  notes: string;
  section: string;
  priority: string;
}

interface DatabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

export function AddItemDialog({
  isOpen,
  onClose,
  onItemAdded,
}: AddItemDialogProps) {
  const supabase = createClient();
  const householdId = useActiveHousehold();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    notes: '',
    section: '',
    priority: 'normal',
    household_id: '', // deprecated but kept for type consistency
  });
  const [aiFormData, setAiFormData] = useState({
    mealType: '',
    preferences: '',
    dietary: '',
    occasion: '',
  });
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [addingItemIndex, setAddingItemIndex] = useState<number | null>(null);

  // Household lookup is now handled by useActiveHousehold(); no additional effect required.

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    let user: { id: string; email?: string } | null = null;
    
    try {
      setIsSubmitting(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
      
      if (!user) {
        toast.error('You must be logged in to add items');
        return;
      }

      if (!householdId) {
        toast.error('Unable to determine active household');
        return;
      }

      // Verify user is actually a member of the household
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id)
        .eq('household_id', householdId)
        .maybeSingle();

      if (membershipError) {
        logger.error('Error checking household membership:', {
          membershipError,
          userId: user.id,
          householdId
        });
        toast.error('Unable to verify household membership');
        return;
      }

      if (!membership) {
        logger.error('User is not a member of the household:', {
          userId: user.id,
          householdId
        });
        toast.error('You are not a member of this household');
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Household membership verified:', membership);
      }

      // Debug: Check if user exists in profiles table
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        logger.error('Error checking user profile:', {
          profileError,
          userId: user.id
        });
      } else if (!profileCheck) {
        logger.warn('User not found in profiles table:', {
          userId: user.id,
          userEmail: user.email
        });
      } else {
        logger.info('User profile verified:', {
          userId: user.id,
          profileExists: true
        });
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info({ 
          ...formData,
          household_id: householdId
        }, 'Adding new item to grocery list');
      }

      // Create a food request with manual flag
      const { data, error } = await supabase
        .from('food_requests')
        .insert([
          {
            household_id: householdId,
            requested_by: user.id,
            item_name: formData.name.trim(),
            item_description: formData.notes.trim() || null,
            quantity: formData.quantity ? parseInt(formData.quantity) : 1,
            unit: formData.unit.trim() || null,
            status: 'approved', // Auto-approve manual additions
            section: formData.section || null,
            priority: formData.priority,
            is_manual: true, // Flag to distinguish from household requests
          }
        ])
        .select()
        .single();

      if (error) {
        logger.error({ 
          error, 
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code,
          insertData: {
            household_id: householdId,
            requested_by: user.id,
            item_name: formData.name.trim(),
            item_description: formData.notes.trim() || null,
            quantity: formData.quantity ? parseInt(formData.quantity) : 1,
            unit: formData.unit.trim() || null,
            status: 'approved',
            section: formData.section || null,
            priority: formData.priority,
            is_manual: true,
          },
          userId: user.id,
          householdId,
          userEmail: user.email
        }, 'Failed to insert food request');
        throw error;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info({ data }, 'Successfully added item to grocery list');
      }

      toast.success('Item added to grocery list');
      onItemAdded();
      onClose();
      setFormData({
        name: '',
        quantity: '',
        unit: '',
        notes: '',
        section: '',
        priority: 'normal',
        household_id: '', // retained for type consistency
      });
    } catch (error: unknown) {
      const dbError = error as DatabaseError;
      
      // Enhanced error logging with complete error serialization
      logger.error({
        errorMessage: dbError.message || 'Unknown error',
        errorDetails: dbError.details || 'No details available',
        errorHint: dbError.hint || 'No hint available',
        errorCode: dbError.code || 'No code available',
        errorString: String(error),
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        formData,
        userId: user?.id,
        householdId,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      }, 'Failed to add item to grocery list - Complete diagnostic');
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to add item to grocery list';
      if (dbError.code === '23503') {
        userMessage = 'Database constraint error: Foreign key reference issue. Please contact support.';
      } else if (dbError.code === '42501') {
        userMessage = 'Permission denied: You may not have access to this household';
      } else if (dbError.code === '23505') {
        userMessage = 'Duplicate item: This item may already exist in your list';
      } else if (dbError.message) {
        userMessage = `Failed to add item: ${dbError.message}`;
      }
      
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiSuggest = async () => {
    // Require at least one preference field before making the request
    if (
      !aiFormData.mealType.trim() &&
      !aiFormData.preferences.trim() &&
      !aiFormData.dietary.trim() &&
      !aiFormData.occasion.trim()
    ) {
      toast.error('Please provide at least one preference for AI suggestions.');
      return;
    }

    try {
      setLoadingSuggestions(true);
      const response = await fetch('/api/meal-grocery-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiFormData),
      });

      if (!response.ok) {
        // Try to extract error details from the response if available
        let errorMessage = 'Failed to get suggestions';
        try {
          const errJson = await response.json();
          errorMessage = errJson.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSuggestions(data.items || []);
    } catch (error) {
      logger.error({ error }, 'Failed to get AI suggestions');
      toast.error(
        error instanceof Error ? error.message : 'Failed to get suggestions. Please try again.'
      );
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Add a suggested item directly to the user's grocery list
  const addSuggestedItem = async (item: SuggestedItem, itemIndex: number) => {
    let user: { id: string; email?: string } | null = null;
    
    try {
      setAddingItemIndex(itemIndex);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;

      if (!user) {
        toast.error('You must be logged in to add items');
        return;
      }

      if (!householdId) {
        toast.error('Unable to determine active household');
        return;
      }

      // Verify user is actually a member of the household
      const { data: membership, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id)
        .eq('household_id', householdId)
        .maybeSingle();

      if (membershipError) {
        logger.error('Error checking household membership:', {
          membershipError,
          userId: user.id,
          householdId
        });
        toast.error('Unable to verify household membership');
        return;
      }

      if (!membership) {
        logger.error('User is not a member of the household:', {
          userId: user.id,
          householdId
        });
        toast.error('You are not a member of this household');
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Household membership verified:', membership);
      }

      // Prepare the data to insert
      const insertData = {
        household_id: householdId,
        requested_by: user.id,
        item_name: item.name.trim(),
        item_description: item.notes?.trim() || null,
        quantity: item.quantity ?? 1,
        unit: item.unit || null,
        section: normaliseCategory((item.section || item.category || '').trim()),
        priority: item.priority === 'urgent' ? 'urgent' : 'normal',
        status: 'approved',
        is_manual: false,
      };

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Adding suggested item:', {
          item,
          householdId,
          userId: user.id,
          insertData
        });
      }

      const { error } = await supabase
        .from('food_requests')
        .insert([insertData]);

      if (error && (error.code || error.message || error.details || error.hint)) {
        logger.error('Database insert error:', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          errorCode: error.code,
          insertData,
          user: { id: user.id, email: user.email },
          householdId
        });
        throw error;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Successfully inserted item');
      }

      toast.success(`${item.name} added to your list`);
      // Refresh the parent page list
      onItemAdded();
    } catch (error: unknown) {
      const dbError = error as DatabaseError;
      
      // Enhanced error logging with complete error serialization
      logger.error({
        errorMessage: dbError.message || 'Unknown error',
        errorDetails: dbError.details || 'No details available',
        errorHint: dbError.hint || 'No hint available',
        errorCode: dbError.code || 'No code available',
        errorString: String(error),
        errorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        item,
        householdId,
        userId: user?.id,
        userEmail: user?.email,
        timestamp: new Date().toISOString()
      }, 'Failed to add suggested item - Complete diagnostic');
      
      let errorMessage = 'Unknown error';
      if (dbError.code === '23503') {
        errorMessage = 'Database constraint error: Foreign key reference issue. Please contact support.';
      } else if (dbError.code === '42501') {
        errorMessage = 'Permission denied: You may not have access to this household';
      } else if (dbError.code === '23505') {
        errorMessage = 'Duplicate item: This item may already exist in your list';
      } else if (dbError.message) {
        errorMessage = dbError.message;
      } else if (dbError.code) {
        errorMessage = `Database error (${dbError.code})`;
      } else if (dbError.hint) {
        errorMessage = dbError.hint;
      }
      
      toast.error(`Failed to add item: ${errorMessage}`);
    } finally {
      setAddingItemIndex(null);
    }
  };

  // Normalise category to one of STORE_SECTIONS (case-insensitive match / keywords)
  const normaliseCategory = (rawCat: string): string => {
    const cat = rawCat.toLowerCase();
    if (cat.includes('produce') || cat.includes('fruit') || cat.includes('vegetable')) return 'Produce';
    if (cat.includes('meat')) return 'Meat';
    if (cat.includes('seafood') || cat.includes('fish') || cat.includes('shrimp')) return 'Seafood';
    if (cat.includes('dairy') || cat.includes('egg')) return 'Dairy & Eggs';
    if (cat.includes('bakery') || cat.includes('bread')) return 'Bakery';
    if (cat.includes('pantry') || cat.includes('canned') || cat.includes('dry')) return 'Pantry';
    if (cat.includes('frozen')) return 'Frozen';
    if (cat.includes('beverage') || cat.includes('drink')) return 'Beverages';
    if (cat.includes('household')) return 'Household';
    return 'Other';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Items</DialogTitle>
          <DialogDescription>
            Add items manually or get AI-powered suggestions based on your needs.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Milk"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Category</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {STORE_SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Household selection removed – now inferred from active session */}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Prefer organic, any brand is fine"
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <Input
                  id="mealType"
                  value={aiFormData.mealType}
                  onChange={(e) => setAiFormData(prev => ({ ...prev, mealType: e.target.value }))}
                  placeholder="e.g., Dinner, Weekly Meals"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  value={aiFormData.occasion}
                  onChange={(e) => setAiFormData(prev => ({ ...prev, occasion: e.target.value }))}
                  placeholder="e.g., Family Dinner, Party"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferences">Food Preferences</Label>
              <Textarea
                id="preferences"
                value={aiFormData.preferences}
                onChange={(e) => setAiFormData(prev => ({ ...prev, preferences: e.target.value }))}
                placeholder="e.g., Mediterranean cuisine, budget-friendly"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary">Dietary Requirements</Label>
              <Input
                id="dietary"
                value={aiFormData.dietary}
                onChange={(e) => setAiFormData(prev => ({ ...prev, dietary: e.target.value }))}
                placeholder="e.g., vegetarian, gluten-free"
              />
            </div>

            <Button 
              onClick={handleAiSuggest}
              disabled={loadingSuggestions}
              className="w-full"
            >
              {loadingSuggestions ? 'Generating Suggestions...' : 'Get Suggestions'}
            </Button>

            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Suggested Items</h3>
                <div className="grid gap-2">
                  {suggestions.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} • {item.section}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSuggestedItem(item, index)}
                        disabled={addingItemIndex === index}
                      >
                        {addingItemIndex === index ? 'Adding...' : 'Add to List'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add to List'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 