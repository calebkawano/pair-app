-- Function to create personal household
CREATE OR REPLACE FUNCTION create_personal_household()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the personal household
  INSERT INTO households (name, created_by, address)
  VALUES (
    NEW.full_name || '''s Personal Household', 
    NEW.id,
    'Personal Household' -- Default address for personal households
  )
  RETURNING id INTO NEW.personal_household_id;

  -- Add the user as an admin of their personal household
  INSERT INTO household_members (household_id, user_id, role)
  VALUES (NEW.personal_household_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_personal_household_trigger ON profiles;

-- Create the trigger
CREATE TRIGGER create_personal_household_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_personal_household();

-- Add column to store personal household ID if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'personal_household_id'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN personal_household_id bigint REFERENCES households(id);
  END IF;
END $$;

-- Create personal households for existing users who don't have one
DO $$ 
DECLARE 
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, full_name 
    FROM profiles 
    WHERE personal_household_id IS NULL
  LOOP
    -- Create personal household
    WITH new_household AS (
      INSERT INTO households (name, created_by, address)
      VALUES (
        user_record.full_name || '''s Personal Household', 
        user_record.id,
        'Personal Household' -- Default address for personal households
      )
      RETURNING id
    )
    -- Update profile and create membership
    INSERT INTO household_members (household_id, user_id, role)
    SELECT id, user_record.id, 'admin'
    FROM new_household;

    -- Update the profile with the personal household ID
    UPDATE profiles 
    SET personal_household_id = (
      SELECT id 
      FROM households 
      WHERE created_by = user_record.id 
      ORDER BY created_at DESC 
      LIMIT 1
    )
    WHERE id = user_record.id;
  END LOOP;
END $$; 