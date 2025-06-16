-- Drop existing policies
DROP POLICY IF EXISTS "Users can view food requests for their households" ON food_requests;
DROP POLICY IF EXISTS "Users can create food requests for their households" ON food_requests;
DROP POLICY IF EXISTS "Admins can update food request status" ON food_requests;
DROP POLICY IF EXISTS "Users can view their own household memberships" ON household_members;
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;

-- Enable RLS
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Household Members policies
CREATE POLICY "Users can view their own household memberships"
  ON household_members
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view households they are members of"
  ON household_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Households policies
CREATE POLICY "Members can view their households"
  ON households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = id
      AND household_members.user_id = auth.uid()
    )
  );

-- Food Requests policies
CREATE POLICY "Members can view their household food requests"
  ON food_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create food requests"
  ON food_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update their own requests"
  ON food_requests
  FOR UPDATE
  USING (
    -- Either the user is the one who requested it
    requested_by = auth.uid()
    OR
    -- Or they are an admin of the household
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = food_requests.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role = 'admin'
    )
  ); 