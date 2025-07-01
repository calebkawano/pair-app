"use client";

import { DietarySuggestionsDialog } from '@/features/grocery/components/dietary-suggestions-dialog';
import { getDietarySuggestions } from '@/lib/api/dietary';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Textarea } from '@/ui/textarea';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DietaryFormData {
  dietaryGoal: string;
  favoriteFood: string;
  cookingTime: string;
  servingCount: string;
}

export default function DietaryPreferencesPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [formData, setFormData] = useState<DietaryFormData>({
    dietaryGoal: '',
    favoriteFood: '',
    cookingTime: '',
    servingCount: '',
  });
  const supabase = createClient();

  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const loadSavedPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch dietary preferences from household_members (first membership)
      const { data: memberRow, error } = await supabase
        .from('household_members')
        .select('dietary_preferences')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (memberRow?.dietary_preferences) {
        setFormData(memberRow.dietary_preferences as DietaryFormData);
      }
    } catch (error) {
      console.error('Error loading dietary preferences:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: keyof DietaryFormData) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save preferences');
        return;
      }

      console.log('Saving preferences to household_members:', formData);

      // Update dietary_preferences on all membership rows for this user
      const { error } = await supabase
        .from('household_members')
        .update({ dietary_preferences: formData })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Dietary preferences saved successfully!');
    } catch (error: any) {
      console.error('Error saving dietary preferences:', error);
      toast.error(`Failed to save dietary preferences: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateGroceryList = async () => {
    if (!formData.dietaryGoal) {
      toast.error('Please fill in your dietary preferences first');
      return;
    }

    setIsGenerating(true);
    try {
      const suggestions = await getDietarySuggestions(formData);
      setSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error('Failed to generate grocery list. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dietary Preferences</h1>
          <p className="text-muted-foreground">
            Set your dietary goals and food preferences to get personalized recommendations.
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
              Back
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handleGenerateGroceryList}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Get Suggestions'}
            </Button>
          </div>
        </form>
      </div>

      <DietarySuggestionsDialog
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        suggestions={suggestions}
        dietaryPreferences={formData}
      />
    </div>
  );
} 