-- Create the get_active_household RPC function
CREATE OR REPLACE FUNCTION get_active_household()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  household_uuid UUID;
BEGIN
  -- Get the authenticated user ID
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  -- Try to get the first household membership for the user
  SELECT household_id INTO household_uuid
  FROM household_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- If no membership found, try to get personal household
  IF household_uuid IS NULL THEN
    SELECT id INTO household_uuid
    FROM households
    WHERE created_by = auth.uid()
    AND is_personal = true
    LIMIT 1;
  END IF;

  RETURN household_uuid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_household() TO authenticated; 