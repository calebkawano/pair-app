'use client';

import { FoodRequestDialog } from "@/features/household/components/food-request-dialog";
import { FoodRequestList } from "@/features/household/components/food-request-list";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { User } from "@supabase/supabase-js";
import { ChevronDown, ChevronUp, Copy, Link as LinkIcon, MessageSquare, PlusCircle } from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type DietaryPreferences = {
  notes?: string;
  [key: string]: unknown;
};

interface Member {
  id: string;
  full_name: string;
  email: string;
  dietary_preferences: DietaryPreferences;
  allergies: string[];
  role: 'admin' | 'member';
}

interface Household {
  id: string;
  name: string;
  members: Member[];
  isExpanded?: boolean;
}

type SupabaseHouseholdMember = {
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
  dietary_preferences: DietaryPreferences;
  allergies?: string[];
  role: 'admin' | 'member';
};

interface SupabaseHouseholdRow {
  id: string;
  name: string;
  household_members: SupabaseHouseholdMember[];
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [invitePhone, setInvitePhone] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showFoodRequestDialog, setShowFoodRequestDialog] = useState(false);
  const [selectedHouseholdForRequest, setSelectedHouseholdForRequest] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    loadUser();
  }, []);

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select(`
          id,
          name,
          household_members (
            user_id,
            role,
            dietary_preferences,
            allergies,
            profiles (
              id,
              full_name,
              email
            )
          )
        `)
        .eq('created_by', user.id);

      if (householdsError) throw householdsError;

      const formattedHouseholds = (householdsData as unknown as SupabaseHouseholdRow[]).map((household) => ({
        id: household.id,
        name: household.name,
        members: household.household_members.map((member) => ({
          id: member.profiles.id,
          full_name: member.profiles.full_name,
          email: member.profiles.email,
          dietary_preferences: member.dietary_preferences,
          allergies: member.allergies || [],
          role: member.role || 'member',
        })),
        isExpanded: false,
      }));

      setHouseholds(formattedHouseholds);
    } catch (error) {
      console.error('Error loading households:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHousehold = (householdId: string) => {
    setHouseholds(prev => prev.map(household => 
      household.id === householdId 
        ? { ...household, isExpanded: !household.isExpanded }
        : household
    ));
  };

  const createHousehold = async () => {
    if (!newHouseholdName.trim()) return;
    
    try {
      setIsCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create a household');
        return;
      }

      // First, create the household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert([
          { 
            name: newHouseholdName.trim(), 
            created_by: user.id 
          }
        ])
        .select()
        .single();

      if (householdError) {
        console.error('Error creating household:', householdError);
        if (householdError.code === 'PGRST301') {
          toast.error('You do not have permission to create households');
        } else {
          toast.error('Failed to create household. Please try again.');
        }
        return;
      }

      if (!household) {
        toast.error('Failed to create household. Please try again.');
        return;
      }

      // Then, add the creator as an admin member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: household.id,
            user_id: user.id,
            role: 'admin',
            dietary_preferences: {},
            allergies: [],
          }
        ]);

      if (memberError) {
        console.error('Error adding member:', memberError);
        // If adding member fails, delete the household
        await supabase
          .from('households')
          .delete()
          .eq('id', household.id);
        
        toast.error('Failed to set up household. Please try again.');
        return;
      }

      await loadHouseholds();
      setNewHouseholdName('');
      setCreateDialogOpen(false);
      toast.success('Household created successfully');
    } catch (error) {
      console.error('Error creating household:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const updateMemberPreferences = async (
    householdId: string,
    memberId: string,
    preferences: DietaryPreferences,
    allergies: string[]
  ) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .update({
          dietary_preferences: preferences,
          allergies: allergies,
        })
        .eq('household_id', householdId)
        .eq('user_id', memberId);

      if (error) throw error;
      await loadHouseholds();
    } catch (error) {
      console.error('Error updating member preferences:', error);
    }
  };

  const generateInviteLink = (householdId: string) => {
    // Generate a unique invite link that includes the household ID
    const baseUrl = window.location.origin;
    return `${baseUrl}/join-household/${householdId}`;
  };

  const copyInviteLink = async (householdId: string) => {
    const link = generateInviteLink(householdId);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const sendTextInvite = async (householdId: string, phoneNumber: string) => {
    setIsSendingInvite(true);
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          householdId,
          householdName: selectedHousehold?.name,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }

      toast.success(`Invite sent to ${phoneNumber}`);
      setInvitePhone('');
      setInviteDialogOpen(false);
    } catch (error) {
      console.error('Failed to send invite:', error);
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRequestFood = (householdId: string) => {
    setSelectedHouseholdForRequest(householdId);
    setShowFoodRequestDialog(true);
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading households...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="space-y-6">
        {/* Description Section */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold">About Household Management</h2>
          <p className="text-muted-foreground">
            Households are designed for families, housemates, or friends who shop together. Whether you're planning meals for your family or coordinating groceries with roommates, households help manage everyone's preferences in one place.
          </p>
          <div className="space-y-2">
            <h3 className="font-medium">Key Benefits:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Coordinate shopping based on household size and preferences</li>
              <li>Track dietary restrictions and allergies for all members</li>
              <li>Manage food requests from household members</li>
              <li>Streamline grocery planning for your group</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Household Management</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Household</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Household</DialogTitle>
                <DialogDescription>
                  Create a new household to manage shopping and meal planning for your group.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Household Name</Label>
                  <Input
                    id="name"
                    value={newHouseholdName}
                    onChange={(e) => setNewHouseholdName(e.target.value)}
                    placeholder="e.g., Smith Family"
                    disabled={isCreating}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={createHousehold} 
                  disabled={!newHouseholdName.trim() || isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invite Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite to Household</DialogTitle>
              <DialogDescription>
                Invite someone to join {selectedHousehold?.name}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text Message</TabsTrigger>
                <TabsTrigger value="link">Share Link</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => selectedHousehold && sendTextInvite(selectedHousehold.id, invitePhone)}
                  disabled={!invitePhone || isSendingInvite}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {isSendingInvite ? 'Sending...' : 'Send Invite'}
                </Button>
              </TabsContent>
              <TabsContent value="link" className="space-y-4">
                <div className="space-y-2">
                  <Label>Shareable Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={selectedHousehold ? generateInviteLink(selectedHousehold.id) : ''}
                    />
                    <Button
                      variant="outline"
                      onClick={() => selectedHousehold && copyInviteLink(selectedHousehold.id)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anyone with this link can join your household
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6">
          {households.map((household) => (
            <Card key={household.id} className="p-6">
              <div className="space-y-4">
                <button
                  className="w-full flex items-center justify-between hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors"
                  onClick={() => toggleHousehold(household.id)}
                >
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-semibold">{household.name}</h2>
                    <Badge variant="secondary">
                      {household.members.length} {household.members.length === 1 ? 'Member' : 'Members'}
                    </Badge>
                  </div>
                  {household.isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </button>

                {household.isExpanded && (
                  <div className="space-y-6 pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Members</h3>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSelectedHousehold(household);
                            setInviteDialogOpen(true);
                          }}
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Invite Member
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        {household.members.map((member) => (
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
                                        {member.allergies?.length > 0 ? (
                                          member.allergies.map((allergy, index) => (
                                            <Badge key={index} variant="secondary">
                                              {allergy}
                                            </Badge>
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
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Food Requests</h3>
                        <Button
                          variant="outline"
                          onClick={() => handleRequestFood(household.id)}
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Request Food
                        </Button>
                      </div>
                      <FoodRequestList
                        householdId={household.id}
                        isAdmin={household.members.some(
                          member => member.role === 'admin' && member.id === user?.id
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Food Request Dialog */}
      <FoodRequestDialog
        isOpen={showFoodRequestDialog}
        onClose={() => {
          setShowFoodRequestDialog(false);
          setSelectedHouseholdForRequest(null);
        }}
        householdId={selectedHouseholdForRequest || ''}
        onRequestCreated={() => loadHouseholds()}
      />
    </div>
  );
} 