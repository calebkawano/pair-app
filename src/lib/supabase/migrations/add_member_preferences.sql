-- Add dietary preferences and allergies to household_members
ALTER TABLE household_members
  ADD COLUMN dietary_preferences jsonb DEFAULT '{}',
  ADD COLUMN allergies text[] DEFAULT ARRAY[]::text[];

-- Add constraints
ALTER TABLE household_members
  ALTER COLUMN role SET NOT NULL,
  ADD CONSTRAINT household_members_role_check 
    CHECK (role IN ('admin', 'member'));

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'household_members_household_id_fkey'
  ) THEN
    ALTER TABLE household_members
      ADD CONSTRAINT household_members_household_id_fkey 
      FOREIGN KEY (household_id) 
      REFERENCES households(id) 
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'household_members_user_id_fkey'
  ) THEN
    ALTER TABLE household_members
      ADD CONSTRAINT household_members_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
  END IF;
END $$; 