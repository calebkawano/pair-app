"use client";

import { FlexInput, FlexValue } from "@/components/FlexInput";
import { getShoppingSuggestions } from '@/lib/api/shopping';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShoppingFormData {
  budget: FlexValue;
  shoppingFrequency: FlexValue;
  favoriteStores: FlexValue;
  avoidStores: FlexValue;
}

interface ShoppingRecommendations {
  budgetBreakdown: {
    category: string;
    suggestedAmount: number;
    percentage: number;
  }[];
  shoppingTips: string[];
  storeRecommendations: {
    store: string;
    reason: string;
    categories: string[];
  }[];
  schedulingAdvice: string;
}

const BUDGET_OPTIONS = [
  { label: "$200", value: "200" },
  { label: "$300", value: "300" },
  { label: "$400", value: "400" },
  { label: "$500", value: "500" },
  { label: "$750", value: "750" },
  { label: "$1000", value: "1000" },
];

const FREQUENCY_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Bi-weekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
];

// We'll fetch real store list later; placeholder values
const STORE_OPTIONS_PLACEHOLDER = [
  { label: "Walmart", value: "Walmart" },
  { label: "Costco", value: "Costco" },
  { label: "Target", value: "Target" },
  { label: "Trader Joe's", value: "Trader Joe's" },
];

export default function ShoppingSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ShoppingRecommendations | null>(null);
  const [formData, setFormData] = useState<ShoppingFormData>({
    budget: { type: "dropdown", value: "" },
    shoppingFrequency: { type: "dropdown", value: "" },
    favoriteStores: { type: "text", value: "" },
    avoidStores: { type: "text", value: "" },
  });

  const handleFlexChange = (field: keyof ShoppingFormData, v: FlexValue) =>
    setFormData((prev) => ({ ...prev, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Store the settings in localStorage
      const plainForm = {
        budget: formData.budget.value,
        shoppingFrequency: formData.shoppingFrequency.value,
        favoriteStores: formData.favoriteStores.value,
        avoidStores: formData.avoidStores.value,
      };
      localStorage.setItem('shoppingSettings', JSON.stringify(plainForm));
      
      // Call the shopping suggestions API
      const suggestions = await getShoppingSuggestions(plainForm);
      
      setRecommendations(suggestions);
      
      // Persist to Supabase (shopping_preferences)
      const { data: { user } } = await createClient().auth.getUser();
      if (user) {
        await (await import('@/lib/supabase/actions')).saveShoppingPreferences(user.id, formData as any);
      }
      
      toast.success('Shopping settings saved successfully!');
      
    } catch (error) {
      console.error('Error saving shopping settings:', error);
      toast.error('Failed to save shopping settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Shopping Settings</h1>
          <p className="text-muted-foreground">
            Configure your shopping preferences to optimize your grocery shopping experience.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Settings Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="p-6 space-y-6">
                <div className="space-y-2">
                  <FlexInput
                    id="budget"
                    label="Monthly Grocery Budget ($)"
                    value={formData.budget}
                    onChange={(v)=>handleFlexChange('budget',v)}
                    options={BUDGET_OPTIONS}
                    placeholder="e.g., 500"
                  />
                </div>

                <div className="space-y-2">
                  <FlexInput id="shoppingFrequency" label="Shopping Frequency" value={formData.shoppingFrequency} onChange={(v)=>handleFlexChange('shoppingFrequency',v)} options={FREQUENCY_OPTIONS} placeholder="Select frequency" />
                </div>

                <div className="space-y-2">
                  <FlexInput id="favoriteStores" label="Preferred Stores" value={formData.favoriteStores} onChange={(v)=>handleFlexChange('favoriteStores',v)} options={STORE_OPTIONS_PLACEHOLDER} placeholder="Walmart, Trader Joe's" />
                </div>

                <div className="space-y-2">
                  <FlexInput id="avoidStores" label="Stores to Avoid" value={formData.avoidStores} onChange={(v)=>handleFlexChange('avoidStores',v)} options={STORE_OPTIONS_PLACEHOLDER} placeholder="Whole Foods" />
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
                  disabled={isLoading}
                >
                  {isLoading ? 'Generating Recommendations...' : 'Save & Get Recommendations'}
                </Button>
              </div>
            </form>
          </div>

          {/* Recommendations Display */}
          <div className="space-y-6">
            {recommendations ? (
              <>
                {/* Budget Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Breakdown</CardTitle>
                    <CardDescription>
                      Suggested allocation for your ${formData.budget.value} monthly budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {recommendations.budgetBreakdown.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{item.category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.percentage}%</Badge>
                          <span className="text-sm text-muted-foreground">
                            ${item.suggestedAmount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Shopping Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shopping Tips</CardTitle>
                    <CardDescription>
                      Personalized advice for your shopping habits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.shoppingTips.map((tip, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Store Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Store Recommendations</CardTitle>
                    <CardDescription>
                      Best stores for your preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.storeRecommendations.map((store, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <h4 className="font-medium">{store.store}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{store.reason}</p>
                        <div className="flex flex-wrap gap-1">
                          {store.categories.map((category, catIndex) => (
                            <Badge key={catIndex} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Scheduling Advice */}
                <Card>
                  <CardHeader>
                    <CardTitle>Scheduling Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{recommendations.schedulingAdvice}</p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Shopping Recommendations</CardTitle>
                  <CardDescription>
                    Fill out your shopping preferences to get personalized recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Complete the form and click "Save & Get Recommendations" to see your personalized shopping advice.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 