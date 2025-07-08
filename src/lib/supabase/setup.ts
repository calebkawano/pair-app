import { logger } from '@/lib/logger';
import { createClient } from './server';

export async function ensureDatabaseSetup() {
  const supabase = await createClient();
  
  try {
    // Check if food_requests table exists and has the required columns
    const { data, error } = await supabase
      .from('food_requests')
      .select('id, priority, section')
      .limit(1);

    if (error) {
      if (error.message?.includes('relation "food_requests" does not exist')) {
        logger.info('Food requests table does not exist, needs to be created');
        return { needsSetup: true, error: 'TABLE_MISSING' };
      } else {
        logger.info('Database access error:', error);
        return { needsSetup: true, error: error.message };
      }
    }

    logger.info('Database tables appear to be set up correctly');
    return { needsSetup: false, error: null };
  } catch (error) {
    logger.error('Error checking database setup:', error);
    return { needsSetup: true, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createFoodRequestsTable() {
  const supabase = await createClient();
  
  try {
    // This would need to be run with admin privileges
    // For now, we'll just log what needs to be done
    logger.info('To set up the database, run the following SQL in your Supabase dashboard:');
    logger.info(`
-- Fix RLS policies that are blocking access
-- Based on debug results: user exists, is member of household, but policies block access

-- First, let's disable RLS temporarily to reset everything
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "household_members_select" ON household_members;
DROP POLICY IF EXISTS "household_members_insert" ON household_members;
DROP POLICY IF EXISTS "household_members_update" ON household_members;
DROP POLICY IF EXISTS "household_members_delete" ON household_members;
DROP POLICY IF EXISTS "households_select" ON households;
DROP POLICY IF EXISTS "households_insert" ON households;
DROP POLICY IF EXISTS "households_update" ON households;
DROP POLICY IF EXISTS "households_delete" ON households;
DROP POLICY IF EXISTS "Members can view their household food requests" ON food_requests;
DROP POLICY IF EXISTS "Members can create food requests" ON food_requests;
DROP POLICY IF EXISTS "Members can update their own requests" ON food_requests;
DROP POLICY IF EXISTS "food_requests_select" ON food_requests;
DROP POLICY IF EXISTS "food_requests_insert" ON food_requests;
DROP POLICY IF EXISTS "food_requests_update" ON food_requests;
DROP POLICY IF EXISTS "food_requests_delete" ON food_requests;

-- Re-enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;

-- Create complete working policies for household_members
CREATE POLICY "household_members_select" ON household_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "household_members_insert" ON household_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "household_members_update" ON household_members
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "household_members_delete" ON household_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Create complete working policies for households
CREATE POLICY "households_select" ON households
  FOR SELECT
  USING (
    id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "households_insert" ON households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "households_update" ON households
  FOR UPDATE
  USING (
    id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "households_delete" ON households
  FOR DELETE
  USING (
    id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create complete working policies for food_requests
CREATE POLICY "food_requests_select" ON food_requests
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "food_requests_insert" ON food_requests
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "food_requests_update" ON food_requests
  FOR UPDATE
  USING (
    requested_by = auth.uid()
    OR
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "food_requests_delete" ON food_requests
  FOR DELETE
  USING (
    requested_by = auth.uid()
    OR
    household_id IN (
      SELECT household_id 
      FROM household_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );
    `);
    
    return { success: false, message: 'RLS Policy fix required - check console for SQL' };
  } catch (error) {
    logger.error('Error in createFoodRequestsTable:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
} 