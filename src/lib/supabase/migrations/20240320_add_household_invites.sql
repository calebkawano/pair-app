-- Create household_invites table
CREATE TABLE household_invites (
  id BIGSERIAL PRIMARY KEY,
  household_id BIGINT REFERENCES households(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add RLS policies
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Add RLS policies
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Allow members to view invites for their households
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

-- Allow admins to create invites
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

-- Create index for faster lookups
CREATE INDEX household_invites_code_idx ON household_invites(code);
CREATE INDEX household_invites_phone_number_idx ON household_invites(phone_number); 