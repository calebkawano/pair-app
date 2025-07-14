'use client';

import { FoodRequestDialog } from '@/features/household/components/food-request-dialog';
import { logger } from '@/lib/logger';
import { Button } from '@/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { HouseholdCard } from './components/HouseholdCard';
import { InviteDialog } from './components/HouseholdDialogs';
import { useHouseholds } from './components/useHouseholds';

export default function HouseholdsPage() {
  const {
    households,
    loading,
    userId,
    createHousehold,
    deleteHousehold,
    toggleExpanded,
  } = useHouseholds();

  /* UI local state */
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<typeof households[0] | null>(null);
  const [foodDialogOpen, setFoodDialogOpen] = useState(false);
  const [foodHouseholdId, setFoodHouseholdId] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createHousehold(newName);
    setNewName('');
    setCreateDialogOpen(false);
  };

  const handleInvite = (h: typeof households[0]) => {
    setSelectedHousehold(h);
    setInviteDialogOpen(true);
  };

  const getInviteLink = (id: string) => `${window.location.origin}/join-household/${id}`;

  const sendSMS = async (id: string, phone: string) => {
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, householdId: id, householdName: selectedHousehold?.name }),
      });
      if (!res.ok) throw new Error('Bad response');
    } catch (err) {
      logger.error('SMS error', err);
      throw err;
    }
  };

  if (loading) return (
    <div className="container max-w-4xl mx-auto p-4"><p className="text-muted-foreground">Loading households...</p></div>
  );

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Household Management</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Household</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Household</DialogTitle>
              <DialogDescription>Create a new household to manage shopping and meal planning.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <input value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Household name" className="border p-2 w-full rounded" />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Household list */}
      <div className="grid gap-6">
        {households.map(h => (
          <HouseholdCard
            key={h.id}
            household={h}
            userId={userId}
            toggle={toggleExpanded}
            onInvite={handleInvite}
            onRequestFood={(id)=>{setFoodHouseholdId(id); setFoodDialogOpen(true);}}
            onDelete={(h)=>deleteHousehold(h.id)}
          />
        ))}
      </div>

      {/* Invite dialog */}
      <InviteDialog
        selected={selectedHousehold}
        open={inviteDialogOpen}
        setOpen={setInviteDialogOpen}
        onInviteLink={getInviteLink}
        onSendSMS={sendSMS}
      />

      {/* Food request */}
      <FoodRequestDialog
        isOpen={foodDialogOpen}
        onClose={()=>setFoodDialogOpen(false)}
        householdId={foodHouseholdId}
        onRequestCreated={() => toast.success('Request added')}
      />
    </div>
  );
} 