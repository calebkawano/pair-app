'use client';

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { useEffect, useState } from "react";
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
  profiles: {
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

  useEffect(() => {
    loadRequests();
  }, [householdId]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      console.log('Loading food requests for household:', householdId);
      
      // First, let's check if we can access the food_requests table at all
      const { data: testData, error: testError } = await supabase
        .from('food_requests')
        .select('count(*)', { count: 'exact', head: true });

      if (testError) {
        console.error('Cannot access food_requests table:', {
          message: testError.message || 'No message',
          details: testError.details || 'No details',
          hint: testError.hint || 'No hint',
          code: testError.code || 'No code',
          errorString: testError.toString(),
          errorKeys: Object.keys(testError),
          fullError: JSON.stringify(testError, null, 2)
        });
        throw new Error(`Table access error: ${testError.message || 'Unknown table error'}`);
      }

      console.log('Table access test successful, count:', testData);
      
      const { data, error } = await supabase
        .from('food_requests')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('household_id', householdId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', {
          message: error.message || 'No message',
          details: error.details || 'No details',
          hint: error.hint || 'No hint',
          code: error.code || 'No code',
          householdId: householdId,
          errorString: error.toString(),
          errorKeys: Object.keys(error),
          fullError: JSON.stringify(error, null, 2)
        });
        throw new Error(`Query error: ${error.message || 'Unknown query error'}`);
      }

      console.log('Raw food requests data:', data);
      
      if (!data) {
        console.log('No food requests data returned');
        setRequests([]);
        return;
      }

      console.log('Setting requests:', data);
      setRequests(data as FoodRequest[]);
    } catch (error) {
      console.error('Error loading requests:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        householdId: householdId,
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
        } else {
          toast.error(`Failed to load food requests: ${error.message}`);
        }
      } else {
        toast.error('Failed to load food requests. Please check your permissions.');
      }
    } finally {
      setLoading(false);
    }
  };

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
                  Requested by {request.profiles?.full_name || 'Unknown'}
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