'use client';

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
import { Textarea } from "@/ui/textarea";
import { useEffect, useState } from 'react';

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
}

interface Household {
  id: string;
  name: string;
  members: Member[];
}

type SupabaseHouseholdMember = {
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
  dietary_preferences: DietaryPreferences;
  allergies?: string[];
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
  const supabase = createClient();

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
        })),
      }));

      setHouseholds(formattedHouseholds);
    } catch (error) {
      console.error('Error loading households:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert([
          { name: newHouseholdName, created_by: user.id }
        ])
        .select()
        .single();

      if (householdError) throw householdError;

      // Add the creator as an admin member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: household.id,
            user_id: user.id,
            role: 'admin',
          }
        ]);

      if (memberError) throw memberError;

      await loadHouseholds();
      setNewHouseholdName('');
    } catch (error) {
      console.error('Error creating household:', error);
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Household Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Household</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Household</DialogTitle>
              <DialogDescription>
                Give your household a name to get started.
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createHousehold}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {households.map((household) => (
          <Card key={household.id} className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">{household.name}</h2>
                <Button variant="outline">Invite Member</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Members</h3>
                <div className="grid gap-4">
                  {household.members.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">{member.full_name}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Edit Preferences</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Dietary Preferences</DialogTitle>
                              <DialogDescription>
                                Update dietary preferences and allergies for {member.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Dietary Preferences</Label>
                                <Textarea
                                  placeholder="e.g., Vegetarian, Gluten-free"
                                  defaultValue={member.dietary_preferences?.notes || ''}
                                  onChange={(e) => {
                                    const newPreferences = {
                                      ...member.dietary_preferences,
                                      notes: e.target.value,
                                    };
                                    updateMemberPreferences(
                                      household.id,
                                      member.id,
                                      newPreferences,
                                      member.allergies
                                    );
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Allergies</Label>
                                <Input
                                  placeholder="e.g., Peanuts, Shellfish"
                                  defaultValue={member.allergies?.join(', ')}
                                  onChange={(e) => {
                                    const newAllergies = e.target.value
                                      .split(',')
                                      .map(item => item.trim())
                                      .filter(Boolean);
                                    updateMemberPreferences(
                                      household.id,
                                      member.id,
                                      member.dietary_preferences,
                                      newAllergies
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="space-y-2">
                        {member.dietary_preferences?.notes && (
                          <div>
                            <span className="text-sm font-medium">Preferences: </span>
                            <span className="text-sm">{member.dietary_preferences.notes}</span>
                          </div>
                        )}
                        {member.allergies?.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-sm font-medium">Allergies:</span>
                            {member.allergies.map((allergy, index) => (
                              <Badge key={index} variant="secondary">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 