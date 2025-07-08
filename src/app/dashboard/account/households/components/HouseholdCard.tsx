import { Household } from '@/dto/household.schema';
import { FoodRequestList } from '@/features/household/components/food-request-list';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChevronDown, ChevronUp, Link as LinkIcon, Palette, PlusCircle, Trash2 } from 'lucide-react';
import { MemberList } from './MemberList';

// color options reused for picker thumbnail
const COLOR_OPTIONS = [
  'bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500',
  'bg-teal-500','bg-indigo-500','bg-red-500','bg-yellow-500','bg-cyan-500'
] as const;

interface Props {
  household: Household;
  userId?: string | null;
  toggle: (id: string) => void;
  onInvite: (h: Household) => void;
  onRequestFood: (id: string) => void;
  onColor: (h: Household) => void;
  onDelete: (h: Household) => void;
}

export function HouseholdCard({ household, userId, toggle, onInvite, onRequestFood, onColor, onDelete }: Props) {
  const getColor = () => {
    if (household.color) return household.color;
    const hash = household.name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    return COLOR_OPTIONS[Math.abs(hash) % COLOR_OPTIONS.length];
  };

  const isAdmin = household.members.some(m => m.role === 'admin' && m.id === userId);

  return (
    <Card className="p-6" key={household.id}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-4 hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors" onClick={() => toggle(household.id)}>
            <h2 className="text-2xl font-semibold">{household.name}</h2>
            <Badge className={`text-white ${getColor()}`}>{household.members.length} {household.members.length === 1 ? 'Member' : 'Members'}</Badge>
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onColor(household)} title="Change household color">
              <Palette className="h-4 w-4" />
            </Button>
            {!household.is_personal && household.created_by === userId && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(household)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <button onClick={() => toggle(household.id)} className="p-2 hover:bg-accent rounded-md transition-colors" title={household.isExpanded ? 'Collapse' : 'Expand'}>
              {household.isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {household.isExpanded && (
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Members</h3>
                <Button variant="outline" onClick={() => onInvite(household)}>
                  <LinkIcon className="w-4 h-4 mr-2" /> Invite Member
                </Button>
              </div>
              <MemberList members={household.members} currentUserId={userId} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Food Requests</h3>
                <Button variant="outline" onClick={() => onRequestFood(household.id)}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Request Food
                </Button>
              </div>
              <FoodRequestList householdId={household.id} isAdmin={isAdmin} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 