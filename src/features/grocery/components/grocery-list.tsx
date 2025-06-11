"use client";

import { GroceryItem } from "@/lib/dummy-data";
import { Card } from "@/ui/card";
import { Check, Store } from "lucide-react";

interface GroceryListProps {
  items: GroceryItem[];
  onToggleItem: (id: string) => void;
}

export function GroceryList({ items, onToggleItem }: GroceryListProps) {
  // Group items by store
  const itemsByStore = items.reduce((acc, item) => {
    if (!acc[item.store]) {
      acc[item.store] = [];
    }
    acc[item.store].push(item);
    return acc;
  }, {} as Record<string, GroceryItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(itemsByStore).map(([store, storeItems]) => (
        <Card key={store} className="overflow-hidden">
          <div className="bg-primary/5 p-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{store}</h3>
          </div>
          <div className="divide-y">
            {storeItems.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center gap-4 hover:bg-accent/5 transition-colors"
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  className={`size-5 rounded border ${
                    item.isChecked
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  } flex items-center justify-center`}
                >
                  {item.isChecked && <Check className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <p className={item.isChecked ? "text-muted-foreground line-through" : ""}>
                    {item.name}
                  </p>
                  {item.quantity && (
                    <p className="text-sm text-muted-foreground">{item.quantity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
} 