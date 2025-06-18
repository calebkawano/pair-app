-- Create recent meals table
CREATE TABLE IF NOT EXISTS recent_meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  cooking_time TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category TEXT,
  dietary_tags TEXT[],
  ingredients TEXT[],
  steps TEXT[],
  nutrition JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_from_groceries BOOLEAN DEFAULT false
);

-- Add indexes
CREATE INDEX IF NOT EXISTS recent_meals_user_id_idx ON recent_meals(user_id);
CREATE INDEX IF NOT EXISTS recent_meals_created_at_idx ON recent_meals(created_at);

-- Enable RLS
ALTER TABLE recent_meals ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their own recent meals"
  ON recent_meals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own recent meals"
  ON recent_meals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recent meals"
  ON recent_meals FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own recent meals"
  ON recent_meals FOR DELETE
  USING (user_id = auth.uid()); 