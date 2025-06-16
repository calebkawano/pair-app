-- Create food requests table
CREATE TABLE IF NOT EXISTS food_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id uuid REFERENCES households(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_description text,
  quantity integer DEFAULT 1,
  unit text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS food_requests_household_id_idx ON food_requests(household_id);
CREATE INDEX IF NOT EXISTS food_requests_requested_by_idx ON food_requests(requested_by);

-- Enable RLS
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view food requests for their households"
  ON food_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create food requests for their households"
  ON food_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update food request status"
  ON food_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  ); 