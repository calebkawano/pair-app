-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own item preferences" ON item_preferences;
DROP POLICY IF EXISTS "Users can view their own item preferences" ON item_preferences;

-- Enable RLS
ALTER TABLE item_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own item preferences"
  ON item_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own item preferences"
  ON item_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item preferences"
  ON item_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item preferences"
  ON item_preferences
  FOR DELETE
  USING (auth.uid() = user_id); 