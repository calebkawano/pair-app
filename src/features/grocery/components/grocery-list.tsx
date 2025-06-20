"use client";

import { GroceryListProps } from "@/types/components";
import { Badge } from "@/ui/badge";
import { Card } from "@/ui/card";
import { Check, Store } from "lucide-react";

export function GroceryList({ 
  items, 
  onToggleItem, 
  showCategories = true,
  showQuantities = true,
  showPriorities = true 
}: GroceryListProps) {
  // Group items by store
  const itemsByStore = items.reduce((acc, item) => {
    const store = item.section || 'Other';
    if (!acc[store]) {
      acc[store] = [];
    }
    acc[store].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-6">
      {Object.entries(itemsByStore).map(([store, storeItems]) => (
        <Card key={store} className="overflow-hidden">
          <div className="bg-primary/5 p-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{store}</h3>
            <span className="text-sm text-muted-foreground">
              ({storeItems.length} {storeItems.length === 1 ? 'item' : 'items'})
            </span>
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
                    item.is_purchased
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-input"
                  } flex items-center justify-center`}
                >
                  {item.is_purchased && <Check className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={item.is_purchased ? "text-muted-foreground line-through" : ""}>
                      {item.name}
                    </p>
                    {showPriorities && item.priority === 'urgent' && (
                      <Badge variant="destructive" className="text-xs">
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {showQuantities && item.quantity && (
                      <span>
                        {item.quantity} {item.unit}
                      </span>
                    )}
                    {showCategories && item.section && (
                      <>
                        <span>•</span>
                        <span>{item.section}</span>
                      </>
                    )}
                    {item.requester && (
                      <>
                        <span>•</span>
                        <span>Added by {item.requester.full_name}</span>
                      </>
                    )}
                  </div>
                  {item.item_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.item_description}
                    </p>
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