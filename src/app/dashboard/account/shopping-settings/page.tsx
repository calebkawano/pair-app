"use client";

import { getShoppingSuggestions } from '@/lib/api/shopping';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShoppingFormData {
  budget: string;
  shoppingFrequency: string;
  favoriteStores: string;
  avoidStores: string;
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

export default function ShoppingSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ShoppingRecommendations | null>(null);
  const [formData, setFormData] = useState<ShoppingFormData>({
    budget: '',
    shoppingFrequency: '',
    favoriteStores: '',
    avoidStores: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: keyof ShoppingFormData) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the shopping suggestions API
      const suggestions = await getShoppingSuggestions(formData);
      
      setRecommendations(suggestions);
      
      // Store the settings in localStorage
      localStorage.setItem('shoppingSettings', JSON.stringify(formData));
      
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
                      Suggested allocation for your ${formData.budget} monthly budget
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