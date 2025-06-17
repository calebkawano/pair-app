"use client";

import { getGrocerySuggestions } from '@/lib/api/grocery';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Textarea } from '@/ui/textarea';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface FormData {
  dietaryGoal: string;
  favoriteFood: string;
  cookingTime: string;
  budget: string;
  shoppingFrequency: string;
  favoriteStores: string;
  avoidStores: string;
  servingCount: string;
}

export default function EditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    dietaryGoal: '',
    favoriteFood: '',
    cookingTime: '',
    budget: '',
    shoppingFrequency: '',
    favoriteStores: '',
    avoidStores: '',
    servingCount: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: keyof FormData) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the AI suggestions API
      const suggestions = await getGrocerySuggestions(formData);
      
      // Store the suggestions in localStorage for the grocery page to use
      localStorage.setItem('grocerySuggestions', JSON.stringify(suggestions));
      
      toast.success('Preferences updated! Redirecting to grocery list...');
      
      // Redirect to the grocery page
      router.push('/dashboard/grocery');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Grocery Preferences</h1>
          <p className="text-muted-foreground">
            Tell us about your shopping habits and preferences to get personalized grocery suggestions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dietaryGoal">Dietary Goal</Label>
              <Select 
                value={formData.dietaryGoal} 
                onValueChange={(value) => handleSelectChange(value, "dietaryGoal")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your dietary goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">Healthy Eating</SelectItem>
                  <SelectItem value="weight-loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                  <SelectItem value="balanced">Balanced Diet</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="paleo">Paleo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteFood">Favorite Types of Food</Label>
              <Textarea
                id="favoriteFood"
                placeholder="E.g., Italian, Asian fusion, Mexican..."
                value={formData.favoriteFood}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookingTime">Cooking Time Preference</Label>
              <Select 
                value={formData.cookingTime} 
                onValueChange={(value) => handleSelectChange(value, "cookingTime")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cooking time preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal (15-20 mins)</SelectItem>
                  <SelectItem value="moderate">Moderate (30-45 mins)</SelectItem>
                  <SelectItem value="hobby">Cooking is my hobby (1+ hours)</SelectItem>
                  <SelectItem value="meal-prep">Weekly meal prep</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Monthly Grocery Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="e.g., 500"
                value={formData.budget}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shoppingFrequency">Shopping Frequency</Label>
              <Select 
                value={formData.shoppingFrequency} 
                onValueChange={(value) => handleSelectChange(value, "shoppingFrequency")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shopping frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteStores">Preferred Stores</Label>
              <Input
                id="favoriteStores"
                placeholder="E.g., Walmart, Trader Joe's, Costco"
                value={formData.favoriteStores}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avoidStores">Stores to Avoid</Label>
              <Input
                id="avoidStores"
                placeholder="E.g., Whole Foods, Target"
                value={formData.avoidStores}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servingCount">Number of People</Label>
              <Input
                id="servingCount"
                type="number"
                placeholder="How many people are you shopping for?"
                value={formData.servingCount}
                onChange={handleInputChange}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Preferences'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 