-- Reset policies to avoid recursion
-- Household Members
DROP POLICY IF EXISTS "household_members_select" ON household_members;
DROP POLICY IF EXISTS "household_members_insert" ON household_members;
DROP POLICY IF EXISTS "household_members_update" ON household_members;
DROP POLICY IF EXISTS "household_members_delete" ON household_members;

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

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

-- Households
DROP POLICY IF EXISTS "households_select" ON households;
DROP POLICY IF EXISTS "households_insert" ON households;
DROP POLICY IF EXISTS "households_update" ON households;

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "households_select" ON households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = households.id AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "households_insert" ON households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "households_update" ON households
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = households.id AND hm.user_id = auth.uid() AND hm.role = 'admin'
    )
  );

-- Food Requests
DROP POLICY IF EXISTS "food_requests_select" ON food_requests;
DROP POLICY IF EXISTS "food_requests_insert" ON food_requests;
DROP POLICY IF EXISTS "food_requests_update" ON food_requests;

ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "food_requests_select" ON food_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = food_requests.household_id AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "food_requests_insert" ON food_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = food_requests.household_id AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "food_requests_update" ON food_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = food_requests.household_id AND hm.user_id = auth.uid() AND hm.role = 'admin'
    )
  ); 