import { Household } from '@/dto/household.schema';
import { logger } from '@/lib/logger';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { Copy, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  selected: Household | null;
  onInviteLink: (householdId: string) => void;
  onSendSMS: (householdId: string, phone: string) => Promise<void>;
  open: boolean;
  setOpen: (o: boolean) => void;
}

export function InviteDialog({ selected, onInviteLink, onSendSMS, open, setOpen }: Props) {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await onSendSMS(selected.id, phone);
      toast.success(`Invite sent to ${phone}`);
      setPhone('');
      setOpen(false);
    } catch (err) {
      logger.error('SMS invite error', err);
      toast.error('Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite to Household</DialogTitle>
          <DialogDescription>Invite someone to join {selected?.name}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Text Message</TabsTrigger>
            <TabsTrigger value="link">Share Link</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e)=>setPhone(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSend} disabled={!phone || sending}>
              <MessageSquare className="w-4 h-4 mr-2" /> {sending ? 'Sending...' : 'Send Invite'}
            </Button>
          </TabsContent>
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input readOnly value={selected ? onInviteLink(selected.id) : ''} />
                <Button variant="outline" onClick={() => selected && navigator.clipboard.writeText(onInviteLink(selected.id))}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Anyone with this link can join your household</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 