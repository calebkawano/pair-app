-- Fix RLS policies that are blocking access
-- Based on debug results: user exists, is member of household, but policies block access

-- First, let's disable RLS temporarily to reset everything
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_preferences DISABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "item_preferences_select" ON item_preferences;
DROP POLICY IF EXISTS "item_preferences_insert" ON item_preferences;
DROP POLICY IF EXISTS "item_preferences_update" ON item_preferences;
DROP POLICY IF EXISTS "item_preferences_delete" ON item_preferences;

-- Re-enable RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_preferences ENABLE ROW LEVEL SECURITY;

-- Create complete working policies for household_members table
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

-- Create complete working policies for households table
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

-- Create complete working policies for food_requests table
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

-- Create complete working policies for profiles table
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR
    id IN (
      SELECT hm.user_id
      FROM household_members hm
      JOIN household_members my_households ON hm.household_id = my_households.household_id
      WHERE my_households.user_id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE
  USING (id = auth.uid());

-- Create complete working policies for item_preferences table
CREATE POLICY "item_preferences_select" ON item_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "item_preferences_insert" ON item_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "item_preferences_update" ON item_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "item_preferences_delete" ON item_preferences
  FOR DELETE
  USING (user_id = auth.uid()); 