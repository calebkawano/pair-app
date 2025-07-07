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
import { ChevronDown, ChevronUp, Copy, Link as LinkIcon, MessageSquare, Palette, PlusCircle, Trash2 } from "lucide-react";
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
  color?: string;
  is_personal?: boolean;
  created_by: string;
  address?: string;
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
  color?: string;
  household_members: SupabaseHouseholdMember[];
  is_personal?: boolean;
  created_by: string;
}

// Predefined color options
const COLOR_OPTIONS = [
  { name: 'Blue', value: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500' },
  { name: 'Teal', value: 'bg-teal-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Red', value: 'bg-red-500' },
  { name: 'Yellow', value: 'bg-yellow-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
];

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [invitePhone, setInvitePhone] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [showFoodRequestDialog, setShowFoodRequestDialog] = useState(false);
  const [selectedHouseholdForRequest, setSelectedHouseholdForRequest] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [householdToDelete, setHouseholdToDelete] = useState<Household | null>(null);

  // Get household color based on saved color or default hash
  const getHouseholdColor = (household: Household) => {
    if (household.color) {
      return household.color;
    }
    // Default hash-based color if no custom color is set
    const hash = household.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return COLOR_OPTIONS[Math.abs(hash) % COLOR_OPTIONS.length].value;
  };

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
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found when loading households');
        return;
      }

      // NOTE: Personal households are automatically created by a database trigger when a user
      // signs up, and the user is added as an admin member in the same transaction.  
      // Because of row-level-security (RLS) rules we cannot reliably read that     
      // household until the membership row exists, so any explicit check/creation   
      // here could race and cause a duplicate-key error. We therefore rely solely   
      // on the membership query below to discover the user's households.

      // First, let's try a simpler query to see if the user has any household memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error fetching household memberships:', membershipError);
        throw membershipError;
      }

      console.log('User household memberships:', membershipData);

      if (!membershipData || membershipData.length === 0) {
        console.log('User is not a member of any households');
        setHouseholds([]);
        return;
      }

      // Get the household IDs the user is a member of
      const householdIds = membershipData.map(m => m.household_id);
      console.log('Household IDs to fetch:', householdIds);

      // Now fetch the household details and all members
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select(`
          id,
          name,
          color,
          is_personal,
          created_by,
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
        .in('id', householdIds);

      if (householdsError) {
        console.error('Supabase error details:', {
          message: householdsError.message,
          details: householdsError.details,
          hint: householdsError.hint,
          code: householdsError.code
        });
        throw householdsError;
      }

      console.log('Raw households data:', householdsData);

      if (!householdsData) {
        console.log('No households data returned');
        setHouseholds([]);
        return;
      }

      const formattedHouseholds = (householdsData as unknown as SupabaseHouseholdRow[]).map((household) => {
        console.log('Processing household:', household);
        return {
          id: household.id,
          name: household.name,
          color: household.color,
          members: household.household_members?.map((member) => ({
            id: member.profiles?.id || '',
            full_name: member.profiles?.full_name || 'Unknown',
            email: member.profiles?.email || 'Unknown',
            dietary_preferences: member.dietary_preferences || {},
            allergies: member.allergies || [],
            role: member.role || 'member',
          })) || [],
          isExpanded: false,
          is_personal: household.is_personal ?? false,
          created_by: household.created_by || '',
        };
      });

      console.log('Formatted households:', formattedHouseholds);
      setHouseholds(formattedHouseholds);
    } catch (error) {
      console.error('Error loading households:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('Failed to load households. Please refresh the page.');
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

  const updateHouseholdColor = async (householdId: string, color: string) => {
    try {
      const { error } = await supabase
        .from('households')
        .update({ color })
        .eq('id', householdId);

      if (error) throw error;

      // Update local state
      setHouseholds(prev => prev.map(household => 
        household.id === householdId 
          ? { ...household, color }
          : household
      ));

      toast.success('Household color updated successfully');
      setColorDialogOpen(false);
    } catch (error) {
      console.error('Error updating household color:', error);
      toast.error('Failed to update household color');
    }
  };

  const openColorDialog = (household: Household) => {
    setSelectedHousehold(household);
    setColorDialogOpen(true);
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

      console.log('Creating household:', {
        name: newHouseholdName.trim(),
        userId: user.id,
        isPersonal: false
      });

      // Create the household and return its id (RETURNING is allowed on the same insert)
      const { data: createdHousehold, error: householdError } = await supabase
        .from('households')
        .insert([
          { 
            name: newHouseholdName.trim(), 
            created_by: user.id,
            is_personal: false,
          }
        ])
        .select('id')
        .single();

      if (householdError) {
        console.error('Error creating household:', {
          error: householdError,
          message: householdError.message,
          details: householdError.details,
          hint: householdError.hint,
          code: householdError.code
        });
        toast.error(`Failed to create household: ${householdError.message || 'Unknown error'}`);
        return;
      }

      if (!createdHousehold) {
        toast.error('Household was created but ID was not returned');
        return;
      }

      const newHouseholdId = createdHousehold.id.toString();
      console.log('Household created successfully with ID:', newHouseholdId);

      // Then, add the creator as an admin member (now passes RLS because household_id is known)
      const { error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: newHouseholdId,
            user_id: user.id,
            role: 'admin',
            dietary_preferences: {},
            allergies: [],
          }
        ]);

      if (memberError) {
        console.error('Error adding member:', {
          error: memberError,
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint,
          code: memberError.code
        });
        
        // If adding member fails, delete the household
        const { error: deleteError } = await supabase
          .from('households')
          .delete()
          .eq('id', newHouseholdId);
          
        if (deleteError) {
          console.error('Error cleaning up household after member creation failed:', deleteError);
        }
        
        toast.error(`Failed to set up household: ${memberError.message}`);
        return;
      }

      console.log('Member added successfully');

      // We don't have the full household row due to RLS, so just reload households list
      await loadHouseholds();
      setNewHouseholdName('');
      setCreateDialogOpen(false);
      toast.success('Household created successfully');
    } catch (error) {
      console.error('Error creating household:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
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

  const handleDeleteHousehold = async () => {
    if (!householdToDelete) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to delete a household');
        return;
      }

      // Check if this is a personal household
      if (householdToDelete.is_personal) {
        toast.error('Cannot delete your personal household');
        return;
      }

      // Check if user is the creator of the household
      if (householdToDelete.created_by !== user.id) {
        toast.error('Only the household creator can delete it');
        return;
      }

      // Delete the household
      const { error: deleteError } = await supabase
        .from('households')
        .delete()
        .eq('id', householdToDelete.id);

      if (deleteError) {
        console.error('Error deleting household:', {
          error: deleteError,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
          code: deleteError.code
        });
        toast.error(`Failed to delete household: ${deleteError.message}`);
        return;
      }

      toast.success('Household deleted successfully');
      setDeleteDialogOpen(false);
      setHouseholdToDelete(null);
      await loadHouseholds();
    } catch (error) {
      console.error('Error deleting household:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error('An unexpected error occurred while deleting the household');
    }
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

        {/* Color Picker Dialog */}
        <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Choose Household Color</DialogTitle>
              <DialogDescription>
                Select a color for {selectedHousehold?.name} tags
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-5 gap-3 py-4">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => selectedHousehold && updateHouseholdColor(selectedHousehold.id, colorOption.value)}
                  className={`w-12 h-12 rounded-lg ${colorOption.value} hover:scale-110 transition-transform border-2 ${
                    selectedHousehold?.color === colorOption.value ? 'border-gray-900 ring-2 ring-gray-400' : 'border-gray-300'
                  }`}
                  title={colorOption.name}
                />
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid gap-6">
          {households.map((household) => (
            <Card key={household.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-4 hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors"
                    onClick={() => toggleHousehold(household.id)}
                  >
                    <h2 className="text-2xl font-semibold">{household.name}</h2>
                    <Badge 
                      className={`text-white ${getHouseholdColor(household)}`}
                    >
                      {household.members.length} {household.members.length === 1 ? 'Member' : 'Members'}
                    </Badge>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openColorDialog(household)}
                      title="Change household color"
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                    {!household.is_personal && household.created_by === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHouseholdToDelete(household);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <button
                      onClick={() => toggleHousehold(household.id)}
                      className="p-2 hover:bg-accent rounded-md transition-colors"
                      title={household.isExpanded ? "Collapse" : "Expand"}
                    >
                      {household.isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

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

      {/* Delete Household Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Household</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {householdToDelete?.name}? This action cannot be undone.
              All household data, including shopping lists and food requests, will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHousehold}
            >
              Delete Household
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 