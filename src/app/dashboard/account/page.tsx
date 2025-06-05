"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function AccountPage() {
  const [formData, setFormData] = useState({
    username: "",
    age: "",
    diet: "",
    allergies: "",
    radius: "5",
    stores: "",
    budget: "500"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add API call to save user preferences
    console.log('Saving user preferences:', formData);
  };

  return (
    <main className="container max-w-2xl mx-auto p-4 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Caleb Kawano"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Your age"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diet">Dietary Preferences</Label>
              <Textarea
                id="diet"
                placeholder="E.g., Vegetarian, Vegan, Keto..."
                value={formData.diet}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                placeholder="List any food allergies..."
                value={formData.allergies}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Shopping Radius (miles)</Label>
              <Input
                id="radius"
                type="number"
                placeholder="5"
                value={formData.radius}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stores">Favorite Stores</Label>
              <Textarea
                id="stores"
                placeholder="List your preferred stores..."
                value={formData.stores}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Monthly Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="500"
                value={formData.budget}
                onChange={handleChange}
              />
            </div>
          </div>

          <Button type="submit" className="w-full">Save Changes</Button>
        </Card>
      </form>
    </main>
  );
} 