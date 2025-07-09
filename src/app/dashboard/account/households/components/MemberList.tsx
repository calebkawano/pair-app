import { Household } from '@/dto/household.schema';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';

interface Props {
  members: Household['members'];
}

export function MemberList({ members }: Props) {
  return (
    <div className="grid gap-4">
      {members.map((member) => (
        <div key={member.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{member.full_name}</h4>
                <Badge variant="outline">
                  {member.role === 'admin' ? 'Head of Household' : 'Member'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{member.email}</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">View Details</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Member Details</DialogTitle>
                  <DialogDescription>
                    View dietary preferences and allergies for {member.full_name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Dietary Preferences</h4>
                    <p className="text-muted-foreground">
                      {member.dietary_preferences?.notes || 'No preferences specified'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Allergies</h4>
                    <div className="flex gap-2 flex-wrap">
                      {member.allergies?.length ? (
                        member.allergies.map((a, i) => (
                          <Badge key={i} variant="secondary">{a}</Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No allergies specified</p>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ))}
    </div>
  );
} 