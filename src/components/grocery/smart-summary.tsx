import { Card } from "@/components/ui/card";
import { SmartSummary } from "@/lib/dummy-data";
import { Clock, DollarSign, Store } from "lucide-react";

interface SmartSummaryProps {
  summary: SmartSummary;
}

export function SmartSummaryCard({ summary }: SmartSummaryProps) {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Smart Shopping Summary</h2>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Store className="h-5 w-5 mt-1 text-primary" />
          <div>
            <p className="font-medium">Recommended Route:</p>
            <p className="text-muted-foreground">
              Visit {summary.stores.map((store, i) => (
                <span key={store}>
                  {i > 0 && i === summary.stores.length - 1 ? " then " : ""}
                  {i > 0 && i < summary.stores.length - 1 ? ", " : ""}
                  {store}
                </span>
              ))} for optimal shopping
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 mt-1 text-primary" />
          <div>
            <p className="font-medium">Estimated Time:</p>
            <p className="text-muted-foreground">
              About {summary.estimatedTime} to complete your shopping
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 mt-1 text-primary" />
          <div>
            <p className="font-medium">Potential Savings:</p>
            <p className="text-muted-foreground">
              Save approximately {summary.estimatedSavings} with this route
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 