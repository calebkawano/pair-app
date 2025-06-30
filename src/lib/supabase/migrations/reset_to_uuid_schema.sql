-- Reset to clean UUID-based schema
-- This migration fixes the type inconsistencies introduced by other migrations

-- Drop problematic tables that were created with wrong ID types
DROP TABLE IF EXISTS food_requests CASCADE;
DROP TABLE IF EXISTS household_invites CASCADE;

-- Drop any conflicting triggers/functions
DROP TRIGGER IF EXISTS create_personal_household_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_personal_household_trigger ON profiles CASCADE;
DROP FUNCTION IF EXISTS create_personal_household() CASCADE;

-- First, fix the households table ID type if it's not UUID
DO $$ 
BEGIN
  -- Check if households.id is not UUID and convert it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'households' 
    AND column_name = 'id' 
    AND data_type != 'uuid'
  ) THEN
    -- Drop all existing policies on households table first
    DROP POLICY IF EXISTS "households_select" ON households;
    DROP POLICY IF EXISTS "households_insert" ON households;
    DROP POLICY IF EXISTS "households_update" ON households;
    DROP POLICY IF EXISTS "households_delete" ON households;
    DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
    DROP POLICY IF EXISTS "Users can view households they are members of" ON households;
    DROP POLICY IF EXISTS "Users can create households" ON households;
    DROP POLICY IF EXISTS "Users can delete non-personal households they created" ON households;
    DROP POLICY IF EXISTS "Users can update their own households" ON households;
    DROP POLICY IF EXISTS "Enable read access for household members" ON households;
    DROP POLICY IF EXISTS "Enable insert for users" ON households;
    DROP POLICY IF EXISTS "Enable update for admins" ON households;
    
    -- Drop all foreign key constraints that reference households.id
    ALTER TABLE household_members DROP CONSTRAINT IF EXISTS household_members_household_id_fkey;
    
    -- Create new UUID column in households
    ALTER TABLE households ADD COLUMN new_id UUID DEFAULT uuid_generate_v4();
    -- Update the new column with unique UUIDs for all households
    UPDATE households SET new_id = uuid_generate_v4();
    
    -- Create new UUID column in household_members
    ALTER TABLE household_members ADD COLUMN new_household_id UUID;
    
    -- Update household_members to reference the new UUIDs using a mapping
    UPDATE household_members hm 
    SET new_household_id = h.new_id
    FROM households h 
    WHERE hm.household_id = h.id;
    
    -- Drop the old primary key constraint and dependent objects
    ALTER TABLE households DROP CONSTRAINT IF EXISTS households_pkey CASCADE;
    
    -- Drop the old columns
    ALTER TABLE households DROP COLUMN id;
    ALTER TABLE household_members DROP COLUMN household_id;
    
    -- Rename the new columns
    ALTER TABLE households RENAME COLUMN new_id TO id;
    ALTER TABLE household_members RENAME COLUMN new_household_id TO household_id;
    
    -- Add primary key constraint
    ALTER TABLE households ADD PRIMARY KEY (id);
    
    -- Make the household_id column NOT NULL
    ALTER TABLE household_members ALTER COLUMN household_id SET NOT NULL;
    
    -- Recreate the foreign key constraint
    ALTER TABLE household_members 
      ADD CONSTRAINT household_members_household_id_fkey 
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure households table has the required columns
ALTER TABLE households ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT false;
ALTER TABLE households ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE households ADD COLUMN IF NOT EXISTS color TEXT;

-- Create food_requests table with proper UUID schema (matching original design)
CREATE TABLE food_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal')),
  section TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_manual BOOLEAN DEFAULT false,
  is_purchased BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  purchased_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create household_invites table with proper UUID schema
CREATE TABLE household_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Add indexes
CREATE INDEX food_requests_household_id_idx ON food_requests(household_id);
CREATE INDEX food_requests_requested_by_idx ON food_requests(requested_by);
CREATE INDEX food_requests_status_idx ON food_requests(status);
CREATE INDEX food_requests_is_purchased_idx ON food_requests(is_purchased);
CREATE INDEX food_requests_is_accepted_idx ON food_requests(is_accepted);

CREATE INDEX household_invites_code_idx ON household_invites(code);
CREATE INDEX household_invites_phone_number_idx ON household_invites(phone_number);

-- Create unique constraint for personal households
DROP INDEX IF EXISTS unique_personal_household_per_user;
CREATE UNIQUE INDEX unique_personal_household_per_user 
ON households (created_by) 
WHERE is_personal = true;

-- Enable RLS
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for food_requests
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

-- RLS policies for household_invites
CREATE POLICY "Members can view household invites"
  ON household_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = household_invites.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create invites"
  ON household_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = household_invites.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  );

-- Ensure households has proper RLS policies (drop any existing ones first)
DROP POLICY IF EXISTS "Users can view households they are members of" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Users can delete non-personal households they created" ON households;
DROP POLICY IF EXISTS "Users can update their own households" ON households;

CREATE POLICY "Users can view households they are members of" ON households
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM household_members
    WHERE household_members.household_id = households.id
    AND household_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create households" ON households
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can delete non-personal households they created" ON households
FOR DELETE
USING (
  auth.uid() = created_by
  AND (is_personal = false OR is_personal IS NULL)
);

CREATE POLICY "Users can update their own households" ON households
FOR UPDATE
USING (
  auth.uid() = created_by
);

-- Create personal household trigger
CREATE OR REPLACE FUNCTION create_personal_household()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- First check if the user already has a personal household
  IF NOT EXISTS (
    SELECT 1 FROM households 
    WHERE created_by = NEW.id 
    AND is_personal = true
  ) THEN
    -- Insert the household and get its ID
    INSERT INTO households (name, created_by, is_personal)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Personal') || ' Household',
      NEW.id,
      true
    )
    RETURNING id INTO new_household_id;
    
    -- Create the household_members entry using the returned ID
    INSERT INTO household_members (household_id, user_id, role, dietary_preferences, allergies)
    VALUES (
      new_household_id,
      NEW.id,
      'admin',
      '{}',
      '{}'::text[]
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on auth.users
CREATE TRIGGER create_personal_household_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_personal_household();

-- Backfill personal households for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  new_household_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT au.id, au.raw_user_meta_data->>'full_name' as full_name 
    FROM auth.users au
    WHERE NOT EXISTS (
      SELECT 1 FROM households h
      WHERE h.created_by = au.id 
      AND h.is_personal = true
    )
  LOOP
    -- Insert the household and get its ID
    INSERT INTO households (name, created_by, is_personal)
    VALUES (
      COALESCE(user_record.full_name, 'Personal') || ' Household',
      user_record.id,
      true
    )
    RETURNING id INTO new_household_id;

    -- Create the household_members entry
    INSERT INTO household_members (household_id, user_id, role, dietary_preferences, allergies)
    VALUES (
      new_household_id,
      user_record.id,
      'admin',
      '{}',
      '{}'::text[]
    );
  END LOOP;
END;
$$; 