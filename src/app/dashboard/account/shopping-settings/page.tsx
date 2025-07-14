"use client";

import { FlexInput, FlexValue } from "@/components/FlexInput";
import {
  type ShoppingFormData,
  type ShoppingRecommendations,
  shoppingRecommendationsSchema
} from '@/dto/shoppingSettings.schema';
import { postShoppingSuggestions } from '@/lib/api/shopping';
import { saveShoppingPreferences } from '@/lib/client/saveShoppingPreferences';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import AES from 'crypto-js/aes';
import encUtf8 from 'crypto-js/enc-utf8';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
  const [previousRecommendations, setPreviousRecommendations] = useState<ShoppingRecommendations | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShoppingFormData>({
    budget: { type: "dropdown", value: "" },
    shoppingFrequency: { type: "dropdown", value: "" },
    favoriteStores: { type: "text", value: "" },
    avoidStores: { type: "text", value: "" },
  });

  const handleFlexChange = (field: keyof ShoppingFormData, v: FlexValue) =>
    setFormData((prev) => ({ ...prev, [field]: v }));

  // Initialize user and load saved preferences
  useEffect(() => {
    const initializeUser = async () => {
      const { data: { user } } = await createClient().auth.getUser();
      if (user) {
        setUserId(user.id);
        loadSavedPreferences(user.id);
      }
    };
    initializeUser();
  }, []);

  const getStorageKey = (userId: string) => 
    `${process.env.NEXT_PUBLIC_APP_SLUG}:${userId}:shoppingSettings`;

  const encryptData = (data: string) => {
    const key = process.env.NEXT_PUBLIC_STORAGE_KEY;
    if (!key) {
      logger.warn('Storage encryption key not configured');
      return data;
    }
    return AES.encrypt(data, key).toString();
  };

  const decryptData = (encryptedData: string) => {
    const key = process.env.NEXT_PUBLIC_STORAGE_KEY;
    if (!key) {
      logger.warn('Storage encryption key not configured');
      return encryptedData;
    }
    try {
      const bytes = AES.decrypt(encryptedData, key);
      return bytes.toString(encUtf8);
    } catch (error) {
      logger.error('Failed to decrypt storage data:', error);
      return null;
    }
  };

  const loadSavedPreferences = (userId: string) => {
    try {
      const storageKey = getStorageKey(userId);
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const decrypted = decryptData(savedData);
        if (decrypted) {
          const parsed = JSON.parse(decrypted);
          setFormData({
            budget: { type: "dropdown", value: parsed.budget || "" },
            shoppingFrequency: { type: "dropdown", value: parsed.shoppingFrequency || "" },
            favoriteStores: { type: "text", value: parsed.favoriteStores || "" },
            avoidStores: { type: "text", value: parsed.avoidStores || "" },
          });
        }
      }
    } catch (error) {
      logger.error('Failed to load saved preferences:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error('You must be logged in to save preferences');
      return;
    }

    setIsLoading(true);
    // Keep previous recommendations while loading
    setPreviousRecommendations(recommendations);

    try {
      // Store the settings in encrypted localStorage
      const plainForm = {
        budget: formData.budget.value,
        shoppingFrequency: formData.shoppingFrequency.value,
        favoriteStores: formData.favoriteStores.value,
        avoidStores: formData.avoidStores.value,
      };
      
      const storageKey = getStorageKey(userId);
      const encryptedData = encryptData(JSON.stringify(plainForm));
      localStorage.setItem(storageKey, encryptedData);
      
      // Call the shopping suggestions API
      const suggestions = await postShoppingSuggestions(plainForm);
      
      // Validate the suggestions with Zod
      try {
        const validatedSuggestions = shoppingRecommendationsSchema.parse(suggestions);
        setRecommendations(validatedSuggestions);
        setPreviousRecommendations(null); // Clear previous state
      } catch (validationError) {
        logger.error('Invalid shopping recommendations format:', validationError);
        toast.error('Received invalid data from server. Please try again.');
        return;
      }
      
      // Persist to Supabase using direct import
      await saveShoppingPreferences(userId, formData);
      
      toast.success('Shopping settings saved successfully!');
      
    } catch (error) {
      logger.error('Error saving shopping settings:', error);
      toast.error('Failed to save shopping settings. Please try again.');
      // Restore previous recommendations on error
      if (previousRecommendations) {
        setRecommendations(previousRecommendations);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-3 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );

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
                  <FlexInput id="favoriteStores" label="Preferred Stores" value={formData.favoriteStores} onChange={(v)=>handleFlexChange('favoriteStores',v)} options={STORE_OPTIONS_PLACEHOLDER} placeholder="Walmart, Trader Joe&apos;s" />
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
                  {isLoading ? 'Generating Recommendations...' : 'Save &amp; Get Recommendations'}
                </Button>
              </div>
            </form>
          </div>

          {/* Recommendations Display */}
          <div className="space-y-6">
            {isLoading && !recommendations && !previousRecommendations ? (
              <LoadingSkeleton />
            ) : (recommendations || previousRecommendations) ? (
              <div className={isLoading ? 'opacity-50' : ''}>
                {/* Budget Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Breakdown</CardTitle>
                    <CardDescription>
                      Suggested allocation for your ${formData.budget.value} monthly budget
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(recommendations || previousRecommendations)?.budgetBreakdown.map((item, index) => (
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
                      {(recommendations || previousRecommendations)?.shoppingTips.map((tip, index) => (
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
                    {(recommendations || previousRecommendations)?.storeRecommendations.map((store, index) => (
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
                    <p className="text-sm">{(recommendations || previousRecommendations)?.schedulingAdvice}</p>
                  </CardContent>
                </Card>
              </div>
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
                    Complete the form and click &quot;Save &amp; Get Recommendations&quot; to see your personalized shopping advice.
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