-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own household memberships" ON household_members;
DROP POLICY IF EXISTS "Users can view households they belong to" ON households;
DROP POLICY IF EXISTS "Members can view their households" ON households;
DROP POLICY IF EXISTS "Enable read access for users" ON household_members;
DROP POLICY IF EXISTS "Enable insert for users" ON household_members;
DROP POLICY IF EXISTS "Enable read access for household members" ON households;
DROP POLICY IF EXISTS "Enable insert for users" ON households;
DROP POLICY IF EXISTS "Enable update for admins" ON households;

-- Enable RLS
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Create base policies for household_members
CREATE POLICY "Enable read access for users" ON household_members
    FOR SELECT
    USING (
        -- User can see their own memberships
        user_id = auth.uid()
        OR 
        -- User can see memberships of households they are an admin in
        household_id IN (
            SELECT household_id 
            FROM household_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Enable insert for users" ON household_members
    FOR INSERT
    WITH CHECK (
        -- Users can only add themselves
        user_id = auth.uid()
        OR
        -- Admins can add others to their households
        household_id IN (
            SELECT household_id 
            FROM household_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create base policies for households
CREATE POLICY "Enable read access for household members" ON households
    FOR SELECT
    USING (
        id IN (
            SELECT household_id 
            FROM household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for users" ON households
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for admins" ON households
    FOR UPDATE
    USING (
        id IN (
            SELECT household_id 
            FROM household_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    ); 