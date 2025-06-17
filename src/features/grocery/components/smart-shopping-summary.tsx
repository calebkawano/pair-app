import { getOptimalRoute, optimizeShoppingList } from "@/lib/pricing/price-service";
import { Card } from "@/ui/card";
import { Clock, MapPin, PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";

interface GroceryItem {
  id: number;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit: string | null;
  priority: 'urgent' | 'normal';
  section?: string | null;
  household: {
    name: string;
  };
  requester: {
    full_name: string;
  };
  approver: {
    full_name: string;
  } | null;
  is_purchased?: boolean;
}

interface SmartShoppingSummaryProps {
  items: GroceryItem[];
}

interface ShoppingOptimization {
  recommendedStore: string;
  totalSavings: number;
  itemsByStore: Record<string, GroceryItem[]>;
  optimalRoute: GroceryItem[];
}

export function SmartShoppingSummary({ items }: SmartShoppingSummaryProps) {
  const [optimization, setOptimization] = useState<ShoppingOptimization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function optimizeList() {
      if (items.length === 0) {
        setOptimization(null);
        return;
      }

      try {
        setLoading(true);
        const { recommendedStore, totalSavings, itemsByStore } = await optimizeShoppingList(items);
        const optimalRoute = getOptimalRoute(itemsByStore[recommendedStore] || []);
        
        setOptimization({
          recommendedStore,
          totalSavings,
          itemsByStore,
          optimalRoute
        });
      } catch (error) {
        console.error('Error optimizing shopping list:', error);
      } finally {
        setLoading(false);
      }
    }

    optimizeList();
  }, [items]);

  // Skip if no items or still loading initial optimization
  if (items.length === 0 || !optimization) return null;

  const { recommendedStore, totalSavings, itemsByStore, optimalRoute } = optimization;
  
  // Calculate estimated time
  const baseTime = 15; // Base time for entering/exiting store, checkout
  const itemTime = items.length * 1; // 1 minute per item
  const storeCount = Object.keys(itemsByStore).length;
  const driveTime = (storeCount - 1) * 15; // 15 minutes between stores
  const totalMinutes = baseTime + itemTime + driveTime;

  // Get route sections in order
  const routeSections = [...new Set(optimalRoute.map(item => item.section).filter(Boolean))];

  // Calculate cart statistics
  const totalItems = items.length;
  const heavyItems = items.filter(item => 
    item.section === "Carbs" || 
    (item.unit && item.unit.toLowerCase().includes("lb"))
  ).length;
  const temperatureSensitive = items.filter(item => 
    item.section === "Dairy" || 
    item.section === "Proteins" ||
    item.section === "Frozen"
  ).length;

  if (loading) {
    return (
      <Card className="p-6 mb-8">
        <div className="text-center text-muted-foreground">
          Optimizing your shopping list...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold">Smart Shopping Summary</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Store & Route */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 mt-1 text-primary" />
          <div>
            <h3 className="font-medium mb-1">Recommended Route</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{recommendedStore}</span>
              <br />
              {routeSections.join(' → ')}
            </p>
            {storeCount > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                Additional savings at: {Object.entries(itemsByStore)
                  .filter(([store]) => store !== recommendedStore)
                  .map(([store, items]) => `${store} (${items.length} items)`)
                  .join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Time Estimate */}
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 mt-1 text-primary" />
          <div>
            <h3 className="font-medium mb-1">Estimated Time</h3>
            <p className="text-sm text-muted-foreground">
              About {totalMinutes < 60 
                ? `${totalMinutes} minutes` 
                : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`} to complete
              {storeCount > 1 && ` (${storeCount} stores)`}
            </p>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-xs text-muted-foreground">
                • Shopping: {itemTime}m
              </p>
              <p className="text-xs text-muted-foreground">
                • Checkout: {baseTime}m
              </p>
              {driveTime > 0 && (
                <p className="text-xs text-muted-foreground">
                  • Travel: {driveTime}m
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Savings & Stats */}
        <div className="flex items-start gap-3">
          <PiggyBank className="h-5 w-5 mt-1 text-primary" />
          <div>
            <h3 className="font-medium mb-1">Savings & Stats</h3>
            <p className="text-sm text-muted-foreground">
              Save approx ${totalSavings.toFixed(2)} with this route
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on current store prices
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 