'use client';

import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card } from "@/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface FoodRequest {
  id: number;
  household_id: number;
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
  };
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

      if (error) throw error;
      setRequests(data as FoodRequest[]);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load food requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: 'approved' | 'declined') => {
    try {
      setUpdating(requestId);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('food_requests')
        .update({
          status,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Request ${status}`);
      loadRequests();
    } catch (error) {
      console.error('Error updating request:', error);
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
      {requests.map((request) => (
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
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                Requested by {request.profiles.full_name}
              </p>
              
              {request.item_description && (
                <p className="text-sm">{request.item_description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <p>
                  Quantity: {request.quantity} {request.unit || 'units'}
                </p>
                {request.section && (
                  <p className="text-muted-foreground">
                    Section: {request.section}
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
      ))}
    </div>
  );
} 