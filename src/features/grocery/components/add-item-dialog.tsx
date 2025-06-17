'use client';

import { PRIORITY_LEVELS, STORE_SECTIONS } from '@/constants/store';
import { createClient } from "@/lib/supabase/client";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Household {
  id: number;
  name: string;
}

type DatabaseHouseholdMember = {
  household_id: number;
  household: Household;
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
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    notes: '',
    section: '',
    priority: 'normal',
    household_id: '',
  });
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const [aiFormData, setAiFormData] = useState({
    mealType: '',
    preferences: '',
    dietary: '',
    occasion: '',
  });
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('Loading households for user:', user.id);
      
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .select('*, household:households(id, name)')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching household members:', memberError);
        toast.error(`Failed to load households: ${memberError.message}`);
        return;
      }

      console.log('Household member data:', memberData);

      if (!memberData || memberData.length === 0) {
        toast.error('You are not a member of any households yet');
        return;
      }

      const uniqueHouseholds = (memberData as DatabaseHouseholdMember[])
        .filter(member => member.household) // Filter out any null households
        .reduce<Household[]>((acc, curr) => {
          if (!acc.some(h => h.id === curr.household.id)) {
            acc.push(curr.household);
          }
          return acc;
        }, []);

      console.log('Unique households:', uniqueHouseholds);
      
      setHouseholds(uniqueHouseholds);
      
      // If there's only one household, automatically select it
      if (uniqueHouseholds.length === 1) {
        setFormData(prev => ({ ...prev, household_id: uniqueHouseholds[0].id.toString() }));
      }
    } catch (error) {
      console.error('Error in loadHouseholds:', error);
      toast.error('Failed to load households. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to add items');
        return;
      }

      console.log('Adding item with data:', {
        ...formData,
        household_id: parseInt(formData.household_id)
      });

      // Create a food request with manual flag
      const { data, error } = await supabase
        .from('food_requests')
        .insert([
          {
            household_id: parseInt(formData.household_id),
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
        console.error('Error details:', error);
        throw error;
      }

      console.log('Successfully added item:', data);
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
        household_id: formData.household_id, // Keep the last selected household
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error(`Failed to add item: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiSuggest = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await fetch('/api/grocery-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiFormData),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');

      const data = await response.json();
      setSuggestions(data.items || []);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast.error('Failed to get suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addSuggestedItem = async (item: any) => {
    setFormData({
      ...formData,
      name: item.name,
      quantity: item.quantity?.toString() || '',
      unit: item.unit || '',
      notes: item.notes || '',
      section: item.section || '',
      priority: item.priority || 'normal',
    });
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
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="e.g., lbs, pcs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Store Section</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
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

            {households.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="household">Household *</Label>
                <Select
                  value={formData.household_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, household_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a household" />
                  </SelectTrigger>
                  <SelectContent>
                    {households.map((household) => (
                      <SelectItem key={household.id} value={household.id.toString()}>
                        {household.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                        onClick={() => addSuggestedItem(item)}
                      >
                        Select
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