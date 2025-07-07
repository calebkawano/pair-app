"use client";

import { FlexInput, FlexValue } from "@/components/FlexInput";
import { DietarySuggestionsDialog } from '@/features/grocery/components/dietary-suggestions-dialog';
import { getDietarySuggestions } from '@/lib/api/dietary';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DietaryFormData {
  dietaryGoal: FlexValue;
  favoriteFood: FlexValue;
  cookingTime: FlexValue;
  servingCount: FlexValue;
}

// Dropdown options
const DIETARY_GOAL_OPTIONS = [
  { label: "Healthy Eating", value: "healthy" },
  { label: "Weight Loss", value: "weight-loss" },
  { label: "Muscle Gain", value: "muscle-gain" },
  { label: "Balanced Diet", value: "balanced" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Vegan", value: "vegan" },
  { label: "Keto", value: "keto" },
  { label: "Paleo", value: "paleo" },
];

const COOKING_TIME_OPTIONS = [
  { label: "Minimal (15-20 mins)", value: "minimal" },
  { label: "Moderate (30-45 mins)", value: "moderate" },
  { label: "Cooking is my hobby (1+ hours)", value: "hobby" },
  { label: "Weekly meal prep", value: "meal-prep" },
];

// Placeholder categories – can be populated from meals data later
const FOOD_CATEGORY_OPTIONS = [
  { label: "Italian", value: "italian" },
  { label: "Mexican", value: "mexican" },
  { label: "Chinese", value: "chinese" },
  { label: "Indian", value: "indian" },
  { label: "Japanese", value: "japanese" },
];

const PEOPLE_OPTIONS = Array.from({ length: 10 }).map((_, i) => ({
  label: `${i + 1}`,
  value: `${i + 1}`,
}));

export default function DietaryPreferencesPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [formData, setFormData] = useState<DietaryFormData>({
    dietaryGoal: { type: "dropdown", value: "" },
    favoriteFood: { type: "text", value: "" },
    cookingTime: { type: "dropdown", value: "" },
    servingCount: { type: "dropdown", value: "" },
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
        const saved = memberRow.dietary_preferences as any;
        setFormData({
          dietaryGoal: saved.dietaryGoal ?? { type: "dropdown", value: "" },
          favoriteFood: saved.favoriteFood ?? { type: "text", value: "" },
          cookingTime: saved.cookingTime ?? { type: "dropdown", value: "" },
          servingCount: saved.servingCount ?? { type: "dropdown", value: "" },
        });
      }
    } catch (error) {
      console.error('Error loading dietary preferences:', error);
    }
  };

  const handleFlexInputChange = (field: keyof DietaryFormData, v: FlexValue) =>
    setFormData((prev) => ({ ...prev, [field]: v }));

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
        .update({ dietary_preferences: formData as any })
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
    if (!formData.dietaryGoal.value) {
      toast.error('Please fill in your dietary preferences first');
      return;
    }

    setIsGenerating(true);
    try {
      // Map FlexValues to plain strings for the AI endpoint
      const plainFormData = {
        dietaryGoal: formData.dietaryGoal.value,
        favoriteFood: formData.favoriteFood.value,
        cookingTime: formData.cookingTime.value,
        servingCount: formData.servingCount.value,
      };

      const suggestions = await getDietarySuggestions(plainFormData);
      setSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error('Failed to generate grocery list. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to derive plain string prefs for external components
  const plainFormData = {
    dietaryGoal: formData.dietaryGoal.value,
    favoriteFood: formData.favoriteFood.value,
    cookingTime: formData.cookingTime.value,
    servingCount: formData.servingCount.value,
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
              <FlexInput
                id="dietaryGoal"
                label="Dietary Goal"
                value={formData.dietaryGoal}
                onChange={(v) => handleFlexInputChange("dietaryGoal", v)}
                options={DIETARY_GOAL_OPTIONS}
                placeholder="Select or type dietary goal"
              />
            </div>

            <div className="space-y-2">
              <FlexInput
                id="favoriteFood"
                label="Favorite Types of Food"
                value={formData.favoriteFood}
                onChange={(v) => handleFlexInputChange("favoriteFood", v)}
                options={FOOD_CATEGORY_OPTIONS}
                placeholder="Enter or select favorite food types"
              />
            </div>

            <div className="space-y-2">
              <FlexInput
                id="cookingTime"
                label="Cooking Time Preference"
                value={formData.cookingTime}
                onChange={(v) => handleFlexInputChange("cookingTime", v)}
                options={COOKING_TIME_OPTIONS}
                placeholder="Select or enter cooking time"
              />
            </div>

            <div className="space-y-2">
              <FlexInput
                id="servingCount"
                label="Number of People"
                value={formData.servingCount}
                onChange={(v) => handleFlexInputChange("servingCount", v)}
                options={PEOPLE_OPTIONS}
                placeholder="Enter number of people"
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
        dietaryPreferences={plainFormData}
      />
    </div>
  );
} 