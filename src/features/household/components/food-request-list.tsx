'use client';

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface FoodRequest {
  id: string | number;
  household_id: string | number;
  item_name: string;
  item_description: string | null;
  quantity: number;
  unit: string | null;
  priority: 'urgent' | 'normal';
  section: string | null;
  status: 'pending' | 'approved' | 'declined';
  created_at: string;
  requested_by: string;
  approved_by?: string;
  requester: {
    full_name: string;
  } | null;
  approver: {
    full_name: string;
  } | null;
}

interface FoodRequestListProps {
  householdId: string;
  isAdmin: boolean;
}

export function FoodRequestList({ householdId, isAdmin }: FoodRequestListProps) {
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // First verify authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        throw new Error('Authentication failed. Please log in again.');
      }

      if (!user) {
        console.error('No authenticated user found');
        throw new Error('Please log in to view food requests.');
      }

      console.log('Loading food requests for household:', householdId, 'user:', user.id);

      // Verify household membership first
      const { data: membershipData, error: membershipError } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', householdId)
        .eq('user_id', user.id)
        .single();

      if (membershipError) {
        console.error('Membership check error:', {
          error: membershipError,
          message: membershipError.message,
          details: membershipError.details,
          hint: membershipError.hint,
          code: membershipError.code
        });
        throw new Error('Failed to verify household membership');
      }

      if (!membershipData) {
        console.error('User is not a member of this household');
        throw new Error('You are not a member of this household');
      }

      console.log('Membership verified:', membershipData);
      
      // Log the household ID and its type
      console.log('Querying with householdId:', {
        value: householdId,
        type: typeof householdId,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(householdId)
      });

      // First try a simple query to verify table access
      const { data: testData, error: testError } = await supabase
        .from('food_requests')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('Initial food requests test query failed:', {
          error: testError,
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
      } else {
        console.log('Initial food requests test query succeeded:', testData);
      }

      // Now try the full query
      const { data, error } = await supabase
        .from('food_requests')
        .select('*')
        .eq('household_id', householdId);

      if (error) {
        // Log the full error object
        console.error('Food requests query error:', {
          error,
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          householdId,
          userId: user.id,
          errorString: error.toString(),
          errorKeys: Object.keys(error),
          fullError: JSON.stringify(error, null, 2),
          // Additional debugging info
          query: {
            table: 'food_requests',
            filter: { household_id: householdId }
          }
        });

        // Try to get more specific error information
        if (error instanceof Error) {
          console.error('Error instance details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            // Try to access potential Supabase-specific properties
            ...(error as Record<string, unknown>)
          });
        }

        throw new Error(`Failed to load food requests: ${error.message || 'Unknown error'}`);
      }

      console.log('Raw food requests data:', data);
      
      if (!data) {
        console.log('No food requests data returned');
        setRequests([]);
        return;
      }

      // If we got data, try the full query with profiles
      const { data: fullData, error: fullError } = await supabase
        .from('food_requests')
        .select(`
          *,
          requester:profiles!food_requests_requested_by_fkey (
            full_name
          ),
          approver:profiles!food_requests_approved_by_fkey (
            full_name
          )
        `)
        .eq('household_id', householdId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (fullError) {
        console.error('Full query with profiles failed:', fullError);
        // Fall back to the simple data we already have
        setRequests(data as FoodRequest[]);
        return;
      }

      console.log('Setting requests:', fullData || data);
      setRequests((fullData || data) as FoodRequest[]);
    } catch (error) {
      console.error('Error loading requests:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        householdId,
        errorString: error?.toString(),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name
      });
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('relation "food_requests" does not exist')) {
          toast.error('Food requests table does not exist. Please contact support.');
        } else if (error.message.includes('permission denied')) {
          toast.error('You do not have permission to view food requests for this household.');
        } else if (error.message.includes('Please log in')) {
          toast.error('Please log in to view food requests.');
        } else if (error.message.includes('not a member')) {
          toast.error('You are not a member of this household.');
        } else {
          toast.error(`Failed to load food requests: ${error.message}`);
        }
      } else {
        toast.error('Failed to load food requests. Please check your permissions.');
      }
    } finally {
      setLoading(false);
    }
  }, [householdId, supabase]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'declined') => {
    try {
      setUpdating(requestId);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to update requests');
        return;
      }

      console.log('Updating request:', requestId, 'to status:', status);

      const { error } = await supabase
        .from('food_requests')
        .update({
          status,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating request status:', error);
        throw error;
      }

      toast.success(`Request ${status}`);
      await loadRequests(); // Reload to get fresh data
    } catch (error) {
      console.error('Error updating request:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        status
      });
      toast.error('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Loading requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No food requests yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        // Ensure we have valid data before rendering
        if (!request || !request.id || !request.item_name) {
          console.warn('Skipping invalid request:', request);
          return null;
        }

        return (
          <Card key={request.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{request.item_name}</h3>
                  <Badge variant={
                    request.status === 'approved' ? 'default' :
                    request.status === 'declined' ? 'destructive' :
                    'secondary'
                  }>
                    {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
                  </Badge>
                  <span
                    className={`px-1.5 py-0.5 text-xs font-bold rounded text-white ${
                      request.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                  >
                    {request.priority === 'urgent' ? 'U' : 'R'}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Requested by {request.requester?.full_name || 'Unknown'}
                </p>
                
                {request.item_description && (
                  <p className="text-sm">{request.item_description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm">
                  <p>
                    Quantity: {request.quantity || 1} {request.unit || 'units'}
                  </p>
                  {request.section && (
                    <p className="text-muted-foreground">
                      Category: {request.section}
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id.toString(), 'approved')}
                    disabled={!!updating}
                  >
                    {updating === request.id.toString() ? 'Updating...' : 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequestStatus(request.id.toString(), 'declined')}
                    disabled={!!updating}
                  >
                    {updating === request.id.toString() ? 'Updating...' : 'Decline'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      }).filter(Boolean)} {/* Filter out any null entries */}
    </div>
  );
} 