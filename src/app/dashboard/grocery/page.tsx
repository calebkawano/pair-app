"use client";

import { GroceryList } from "@/components/grocery/grocery-list";
import { SmartSummaryCard } from "@/components/grocery/smart-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { dummyGroceryList, dummySmartSummary } from "@/lib/dummy-data";
import { Plus, Wand2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function GroceryPage() {
  // This will be replaced with real state management later
  const [hasGroceryList, setHasGroceryList] = useState(true); // Set to true to see the active state
  const [groceryItems, setGroceryItems] = useState(dummyGroceryList);

  const toggleItem = (id: string) => {
    setGroceryItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  return (
    <main className="container max-w-4xl mx-auto p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Grocery List</h1>
        <Button variant="ghost" size="icon" aria-label="Add item manually">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Empty State */}
      {!hasGroceryList && (
        <Card className="p-6">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-xl font-semibold">No Shopping List Yet</h2>
            <p className="text-muted-foreground">
              Start smart shopping or create quick meals to generate your personalized shopping list.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
            <Button asChild>
              <Link href="/dashboard/edit">Start Smart Shopping</Link>
            </Button>
            <Button variant="outline">
              Quick Meals
            </Button>
          </div>
        </Card>
      )}

      {/* Active State */}
      {hasGroceryList && (
        <>
          <SmartSummaryCard summary={dummySmartSummary} />
          <GroceryList items={groceryItems} onToggleItem={toggleItem} />
          <div className="mt-8 flex justify-center">
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Make Smart Meals
            </Button>
          </div>
        </>
      )}
    </main>
  );
} 