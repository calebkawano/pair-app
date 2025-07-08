import {
    type Household,
    membershipDataSchema,
    supabaseHouseholdRowSchema,
} from '@/dto/household.schema';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Centralised data/logic layer for household management UI.
 * Returns all state & mutation helpers needed by the screens/components.
 */
export function useHouseholds() {
  const supabase = createClient();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  /* -------------------------------- helpers ------------------------------- */
  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id ?? null);
  }, [supabase]);

  /** Core fetch that hydrates households list */
  const loadHouseholds = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membershipData, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;
      if (!membershipData?.length) {
        setHouseholds([]);
        return;
      }

      const validatedMemberships = membershipData.map((item) => membershipDataSchema.parse(item));
      const householdIds = validatedMemberships.map(m => m.household_id);

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

      if (householdsError) throw householdsError;
      if (!householdsData) return setHouseholds([]);

      const formatted = householdsData.map(row => {
        try {
          const h = supabaseHouseholdRowSchema.parse(row);
          return {
            id: h.id,
            name: h.name,
            color: h.color || undefined,
            members: h.household_members?.map(m => ({
              id: m.profiles?.id || '',
              full_name: m.profiles?.full_name || 'Unknown',
              email: m.profiles?.email || 'Unknown',
              dietary_preferences: m.dietary_preferences || {},
              allergies: m.allergies || [],
              role: m.role || 'member',
            })) || [],
            isExpanded: false,
            is_personal: h.is_personal ?? false,
            created_by: h.created_by,
          } satisfies Household;
        } catch (err) {
          logger.error('Bad household row', err);
          return null;
        }
      }).filter(Boolean) as Household[];

      setHouseholds(formatted);
    } catch (error) {
      logger.error('Failed to load households', error);
      toast.error('Failed to load households. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /* ---------------------------- mutations ---------------------------- */
  const createHousehold = useCallback(async (name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('households')
        .insert([{ name: name.trim(), created_by: user.id, is_personal: false }])
        .select('id')
        .single();
      if (error || !data) throw error;
      await supabase
        .from('household_members')
        .insert([{ household_id: data.id, user_id: user.id, role: 'admin', dietary_preferences: {}, allergies: [] }]);
      toast.success('Household created');
      await loadHouseholds();
    } catch (err) {
      logger.error('Create household error', err);
      toast.error('Failed to create household');
    }
  }, [loadHouseholds, supabase]);

  const updateHouseholdColor = useCallback(async (id: string, color: string) => {
    try {
      const { error } = await supabase.from('households').update({ color }).eq('id', id);
      if (error) throw error;
      setHouseholds(prev => prev.map(h => h.id === id ? { ...h, color } : h));
    } catch (err) {
      logger.error('Update color err', err);
      toast.error('Failed to update color');
    }
  }, [supabase]);

  const deleteHousehold = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('households').delete().eq('id', id);
      if (error) throw error;
      setHouseholds(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      logger.error('Delete household err', err);
      toast.error('Failed deleting household');
    }
  }, [supabase]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (userId) loadHouseholds();
  }, [loadHouseholds, userId]);

  return {
    households,
    loading,
    userId,
    createHousehold,
    updateHouseholdColor,
    deleteHousehold,
    reload: loadHouseholds,
  } as const;
} 