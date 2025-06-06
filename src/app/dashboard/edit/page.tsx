"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    dietaryGoal: "",
    favoriteFood: "",
    cookingTime: "",
    budget: "",
    shoppingFrequency: "",
    favoriteStores: "",
    avoidStores: "",
    servingCount: "1",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSelectChange = (value: string, field: keyof FormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const simulateAIGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Simulate AI thinking steps
    const steps = [
      "Analyzing dietary preferences...",
      "Calculating optimal meal combinations...",
      "Finding the best stores in your area...",
      "Optimizing shopping route...",
      "Generating smart shopping list..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setProgress((i + 1) * (100 / steps.length));
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setIsGenerating(false);
    setShowCompletionDialog(true);
  };

  return (
    <>
      <main className="container max-w-4xl mx-auto p-4 space-y-8 pb-20">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Customize Your Shopping Experience</h1>
          <p className="text-muted-foreground">
            The more information you provide, the more personalized your shopping list and meal suggestions will be.
            All fields are optional, but more details help us serve you better.
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); simulateAIGeneration(); }} className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dietaryGoal">Dietary Goal or Restriction</Label>
                <div className="relative w-full">
                  <Select 
                    value={formData.dietaryGoal} 
                    onValueChange={(value) => handleSelectChange(value, "dietaryGoal")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your dietary goal" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} align="center">
                      <SelectItem value="high-protein">High Protein</SelectItem>
                      <SelectItem value="low-carb">Low Carb</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="none">No Specific Diet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="relative w-full">
                  <Select 
                    value={formData.cookingTime} 
                    onValueChange={(value) => handleSelectChange(value, "cookingTime")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cooking time preference" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} align="center">
                      <SelectItem value="minimal">Minimal (15-20 mins)</SelectItem>
                      <SelectItem value="moderate">Moderate (30-45 mins)</SelectItem>
                      <SelectItem value="hobby">Cooking is my hobby (1+ hours)</SelectItem>
                      <SelectItem value="meal-prep">Weekly meal prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                <div className="relative w-full">
                  <Select 
                    value={formData.shoppingFrequency} 
                    onValueChange={(value) => handleSelectChange(value, "shoppingFrequency")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How often do you want to shop?" />
                    </SelectTrigger>
                    <SelectContent sideOffset={4} align="center">
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="as-needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favoriteStores">Preferred Stores</Label>
                <Textarea
                  id="favoriteStores"
                  placeholder="List your favorite stores..."
                  value={formData.favoriteStores}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avoidStores">Stores to Avoid</Label>
                <Textarea
                  id="avoidStores"
                  placeholder="List stores you'd rather not visit..."
                  value={formData.avoidStores}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servingCount">Number of People to Serve</Label>
                <Input
                  id="servingCount"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.servingCount}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-primary">{currentStep}</p>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <Button type="submit" className="w-full">
                  Create Smart Shopping List
                </Button>
              )}
            </div>
          </Card>
        </form>
      </main>

      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shopping List Generated!</DialogTitle>
            <DialogDescription>
              Your smart shopping list has been created based on your preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowCompletionDialog(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Stay Here
            </Button>
            <Button
              onClick={() => router.push("/dashboard/grocery")}
              className="flex items-center gap-2"
            >
              View Shopping List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 