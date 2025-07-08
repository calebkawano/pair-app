"use client";

import { FlexInput, FlexValue } from "@/components/FlexInput";
import {
  type DietaryPreferences,
  type DietarySuggestion,
  dietaryPreferencesSchema,
  plainDietaryPreferencesSchema
} from '@/dto/dietarySuggestion.schema';
import { DietarySuggestionsDialog } from '@/features/grocery/components/dietary-suggestions-dialog';
import { getDietarySuggestions } from '@/lib/api/dietary';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Lazy-load constant options to avoid bundling static data multiple times
async function loadDietaryConstants() {
  const mod = await import('@/constants/dietary');
  return {
    GOALS: mod.DIETARY_GOAL_OPTIONS,
    COOKING_TIMES: mod.COOKING_TIME_OPTIONS,
    CATEGORIES: mod.FOOD_CATEGORY_OPTIONS,
  } as const;
}

/* ------------------------------------------------------------------
 * Error boundary to protect the preferences form from runtime errors
 * ------------------------------------------------------------------*/
interface BoundaryProps {
  children: React.ReactNode;
}

class PreferencesErrorBoundary extends React.Component<BoundaryProps, { hasError: boolean }> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    logger.error('Dietary Preferences render error', { error, info });
    toast.error('Something went wrong loading the dietary preferences UI.');
  }

  render() {
    if (this.state.hasError) {
      // Render nothing – toast already shown – but keep outer state alive
      return null;
    }
    return this.props.children;
  }
}

export default function DietaryPreferencesPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<DietarySuggestion[]>([]);
  const [formData, setFormData] = useState<DietaryPreferences>({
    dietaryGoal: { type: "dropdown", value: "" },
    favoriteFood: { type: "text", value: "" },
    cookingTime: { type: "dropdown", value: "" },
    servingCount: { type: "dropdown", value: "" },
  });
  const supabase = createClient();

  // Option state loaded on first render
  const [options, setOptions] = useState<{
    GOALS: { label: string; value: string }[];
    COOKING_TIMES: { label: string; value: string }[];
    CATEGORIES: { label: string; value: string }[];
  }>({ GOALS: [], COOKING_TIMES: [], CATEGORIES: [] });

  useEffect(() => {
    // Dynamically import the constants – could be replaced with API call later
    loadDietaryConstants().then(setOptions).catch((err) => {
      logger.error('Failed to load dietary constants', err);
      toast.error('Unable to load dietary options. Please refresh.');
    });
  }, []);

  // Memoised people options so array identity stays stable
  const PEOPLE_OPTIONS = useMemo(
    () => Array.from({ length: 10 }).map((_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
    []
  );

  useEffect(() => {
    loadSavedPreferences();
  }, []);

  const loadSavedPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberRow, error } = await supabase
        .from('household_members')
        .select('dietary_preferences')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (memberRow?.dietary_preferences) {
        // Attempt modern schema first
        const modernParse = dietaryPreferencesSchema.safeParse(memberRow.dietary_preferences);
        if (modernParse.success) {
          setFormData(modernParse.data);
        } else {
          // Fallback: try legacy plain schema and transform
          const legacyParse = plainDietaryPreferencesSchema.safeParse(memberRow.dietary_preferences);
          if (legacyParse.success) {
            const legacy = legacyParse.data;
            const upgraded: DietaryPreferences = {
              dietaryGoal: { type: 'text', value: legacy.dietaryGoal },
              favoriteFood: { type: 'text', value: legacy.favoriteFood },
              cookingTime: { type: 'text', value: legacy.cookingTime },
              servingCount: { type: 'text', value: legacy.servingCount },
            };
            setFormData(upgraded);
            // Optionally persist upgraded format back
            try {
              await supabase
                .from('household_members')
                .update({ dietary_preferences: upgraded })
                .eq('user_id', user.id);
            } catch (persistErr) {
              logger.warn('Failed to upgrade stored dietary preferences', persistErr);
            }
          } else {
            logger.error('Invalid dietary preferences format – unable to parse with either schema', {
              issues: modernParse.error.issues,
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error loading dietary preferences:', error);
    }
  };

  const handleFlexInputChange = (field: keyof DietaryPreferences, v: FlexValue) =>
    setFormData((prev) => ({ ...prev, [field]: v }));

  /* ------------------------------ Save handler ------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save preferences');
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        logger.info('Saving preferences to household_members:', formData);
      }

      const { error } = await supabase
        .from('household_members')
        .update({ dietary_preferences: formData })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Dietary preferences saved successfully!');
    } catch (error: any) {
      logger.error('Error saving dietary preferences:', error);
      toast.error(`Failed to save dietary preferences: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  /* --------------------------- AI suggestion flow --------------------------- */
  const handleGenerateGroceryList = async () => {
    if (!formData.dietaryGoal.value) {
      toast.error('Please fill in your dietary preferences first');
      return;
    }

    setIsGenerating(true);
    try {
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
      logger.error('Error generating grocery list:', error);
      toast.error('Failed to generate grocery list. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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

        <PreferencesErrorBoundary>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-2">
                <FlexInput
                  id="dietaryGoal"
                  label="Dietary Goal"
                  value={formData.dietaryGoal}
                  onChange={(v) => handleFlexInputChange("dietaryGoal", v)}
                  options={options.GOALS}
                  placeholder="Select or type dietary goal"
                />
              </div>

              <div className="space-y-2">
                <FlexInput
                  id="favoriteFood"
                  label="Favorite Types of Food"
                  value={formData.favoriteFood}
                  onChange={(v) => handleFlexInputChange("favoriteFood", v)}
                  options={options.CATEGORIES}
                  placeholder="Enter or select favorite food types"
                />
              </div>

              <div className="space-y-2">
                <FlexInput
                  id="cookingTime"
                  label="Cooking Time Preference"
                  value={formData.cookingTime}
                  onChange={(v) => handleFlexInputChange("cookingTime", v)}
                  options={options.COOKING_TIMES}
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
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
              <Button type="button" variant="default" onClick={handleGenerateGroceryList} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Get Suggestions'}
              </Button>
            </div>
          </form>
        </PreferencesErrorBoundary>
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