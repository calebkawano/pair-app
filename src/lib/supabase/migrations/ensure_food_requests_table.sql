-- Ensure food_requests table exists with all necessary columns
CREATE TABLE IF NOT EXISTS food_requests (
  id BIGSERIAL PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_description TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal')),
  section TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add missing columns if they don't exist
ALTER TABLE food_requests 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'normal'));

ALTER TABLE food_requests 
ADD COLUMN IF NOT EXISTS section TEXT;

ALTER TABLE food_requests 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS food_requests_household_id_idx ON food_requests(household_id);
CREATE INDEX IF NOT EXISTS food_requests_requested_by_idx ON food_requests(requested_by);
CREATE INDEX IF NOT EXISTS food_requests_status_idx ON food_requests(status);

-- Enable RLS
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Members can view their household food requests" ON food_requests;
DROP POLICY IF EXISTS "Members can create food requests" ON food_requests;
DROP POLICY IF EXISTS "Members can update their own requests" ON food_requests;
DROP POLICY IF EXISTS "Admins can update food request status" ON food_requests;

-- Create comprehensive RLS policies
CREATE POLICY "Members can view their household food requests"
  ON food_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create food requests"
  ON food_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Members can update their own requests"
  ON food_requests FOR UPDATE
  USING (
    requested_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  ); 