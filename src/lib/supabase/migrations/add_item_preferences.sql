-- Create item preferences table
CREATE TABLE IF NOT EXISTS item_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  section text,
  preference_type text NOT NULL CHECK (preference_type IN ('accept', 'reject')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS item_preferences_user_id_idx ON item_preferences(user_id);
CREATE INDEX IF NOT EXISTS item_preferences_item_name_idx ON item_preferences(item_name);

-- Enable RLS
ALTER TABLE item_preferences ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own item preferences"
  ON item_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own item preferences"
  ON item_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add unique constraint
ALTER TABLE item_preferences
  ADD CONSTRAINT item_preferences_user_item_unique 
  UNIQUE (user_id, item_name); 