import { GroceryItem } from "@/types/grocery";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";

interface RecentGroceriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: GroceryItem[];
}

export function RecentGroceriesDialog({ isOpen, onClose, items }: RecentGroceriesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recently Bought Items</DialogTitle>
          <DialogDescription>
            The last 30 items you cleared from your cart
          </DialogDescription>
        </DialogHeader>

        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No recent items yet.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{(item as any).item_name || item.name}</p>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit} • {item.section || "Uncategorized"}
                  </div>
                </div>
                <Badge variant="secondary">Cleared</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 text-right">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 