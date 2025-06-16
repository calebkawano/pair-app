-- Fix households table
ALTER TABLE households
  DROP COLUMN IF EXISTS user_id,
  ALTER COLUMN created_id SET NOT NULL,
  ALTER COLUMN created_id SET DEFAULT auth.uid(),
  RENAME COLUMN created_id TO created_by,
  ADD CONSTRAINT households_created_by_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;

-- Fix household_members table
ALTER TABLE household_members
  ADD COLUMN IF NOT EXISTS dietary_preferences jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ALTER COLUMN role SET NOT NULL,
  ADD CONSTRAINT household_members_role_check 
    CHECK (role IN ('admin', 'member')),
  ADD CONSTRAINT household_members_household_id_fkey 
    FOREIGN KEY (household_id) 
    REFERENCES households(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT household_members_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE; 