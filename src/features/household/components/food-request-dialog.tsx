'use client';

import { STORE_SECTIONS } from '@/constants/store';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Textarea } from "@/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

interface FoodRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  onRequestCreated: () => void;
}

// Available units for dropdown - shared with grocery add item
const UNITS = [
  'pcs', 'lbs', 'oz', 'kg', 'g', 'cups', 'tbsp', 'tsp', 'bottles', 'cans', 'boxes', 'bags', 'loaves'
];

export function FoodRequestDialog({
  isOpen,
  onClose,
  householdId,
  onRequestCreated,
}: FoodRequestDialogProps) {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    quantity: 1,
    unit: '',
    priority: 'normal' as 'urgent' | 'normal',
    section: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!formData.itemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to make requests');
        return;
      }

      const { error } = await supabase
        .from('food_requests')
        .insert([
          {
            household_id: householdId,
            requested_by: user.id,
            item_name: formData.itemName.trim(),
            item_description: formData.description.trim() || null,
            quantity: formData.quantity,
            unit: formData.unit.trim() || null,
            priority: formData.priority,
            section: formData.section || null,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Food request created successfully');
      onRequestCreated();
      onClose();
      setFormData({
        itemName: '',
        description: '',
        quantity: 1,
        unit: '',
        priority: 'normal',
        section: '',
      });
    } catch (error) {
      console.error('Error creating food request:', error);
      toast.error('Failed to create food request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Food Item</DialogTitle>
          <DialogDescription>
            Request a food item to be added to the household shopping list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
              placeholder="e.g., Chicken Breast"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Organic, boneless, from Costco"
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
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'urgent' | 'normal') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Regular</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Category</Label>
              <Select
                value={formData.section}
                onValueChange={(value) => setFormData(prev => ({ ...prev, section: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.itemName.trim()}
          >
            {isSubmitting ? 'Requesting...' : 'Request Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 