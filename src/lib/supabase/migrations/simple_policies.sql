-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own household memberships" ON household_members;
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
DROP POLICY IF EXISTS "Members can view their households" ON households;
DROP POLICY IF EXISTS "Enable read access for users" ON household_members;
DROP POLICY IF EXISTS "Enable insert for users" ON household_members;
DROP POLICY IF EXISTS "Enable read access for household members" ON households;
DROP POLICY IF EXISTS "Enable insert for users" ON households;
DROP POLICY IF EXISTS "Enable update for admins" ON households;
DROP POLICY IF EXISTS "Members can view their household food requests" ON food_requests;
DROP POLICY IF EXISTS "Members can create food requests" ON food_requests;
DROP POLICY IF EXISTS "Members can update their own requests" ON food_requests;

-- Disable RLS temporarily
ALTER TABLE household_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE households DISABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_requests ENABLE ROW LEVEL SECURITY;

-- Simple household_members policies (no recursion)
CREATE POLICY "household_members_select" ON household_members
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "household_members_insert" ON household_members
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Simple households policies (no complex joins)
CREATE POLICY "households_select" ON households
    FOR SELECT
    USING (true); -- Allow reading all households for now

CREATE POLICY "households_insert" ON households
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "households_update" ON households
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Simple food_requests policies
CREATE POLICY "food_requests_select" ON food_requests
    FOR SELECT
    USING (
        requested_by = auth.uid()
        OR approved_by = auth.uid()
    );

CREATE POLICY "food_requests_insert" ON food_requests
    FOR INSERT
    WITH CHECK (requested_by = auth.uid());

CREATE POLICY "food_requests_update" ON food_requests
    FOR UPDATE
    USING (
        requested_by = auth.uid()
        OR approved_by = auth.uid()
    ); 