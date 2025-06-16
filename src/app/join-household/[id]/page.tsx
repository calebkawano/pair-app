'use client';

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface JoinHouseholdPageProps {
  params: {
    id: string;
  };
}

export default function JoinHouseholdPage({ params }: JoinHouseholdPageProps) {
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [household, setHousehold] = useState<{ id: string; name: string; } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkHousehold();
  }, []);

  const checkHousehold = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to join a household');
        return;
      }

      // Check if user is already a member
      const { data: memberData } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('household_id', params.id)
        .eq('user_id', user.id)
        .single();

      if (memberData) {
        setError('You are already a member of this household');
        return;
      }

      // Get household details
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('id, name')
        .eq('id', params.id)
        .single();

      if (householdError || !householdData) {
        setError('Invalid or expired invite link');
        return;
      }

      setHousehold(householdData);
    } catch (error) {
      console.error('Error checking household:', error);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const joinHousehold = async () => {
    try {
      setJoining(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !household) return;

      // Add user as a member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert([
          {
            household_id: household.id,
            user_id: user.id,
            role: 'member',
            dietary_preferences: {},
            allergies: [],
          }
        ]);

      if (memberError) throw memberError;

      toast.success('Successfully joined household');
      router.push('/dashboard/account/households');
    } catch (error) {
      console.error('Error joining household:', error);
      toast.error('Failed to join household');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-md mx-auto p-4">
        <Card className="p-6 space-y-4">
          <h1 className="text-2xl font-bold text-center">Unable to Join</h1>
          <p className="text-center text-muted-foreground">{error}</p>
          <div className="flex justify-center">
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card className="p-6 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Join Household</h1>
          <p className="text-muted-foreground">
            You've been invited to join {household?.name}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            By joining this household, you'll be able to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Request items for the shopping list</li>
            <li>Share your dietary preferences</li>
            <li>Participate in household meal planning</li>
          </ul>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            onClick={joinHousehold} 
            disabled={joining}
            className="min-w-[200px]"
          >
            {joining ? 'Joining...' : 'Join Household'}
          </Button>
        </div>
      </Card>
    </div>
  );
} 