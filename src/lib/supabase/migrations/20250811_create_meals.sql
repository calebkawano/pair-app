-- Create meals catalog table for Spoonacular (and other sources)
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'spoonacular', -- e.g., spoonacular, edamam, manual
  source_id TEXT,                              -- provider-specific id
  name TEXT NOT NULL,
  category TEXT,                               -- e.g., vegan, vegetarian, keto, random
  cuisine TEXT,                                -- e.g., mexican, italian
  diet_tags TEXT[],                            -- diet/labels/tags
  cooking_time_minutes INTEGER,
  ingredients JSONB,                           -- array of strings or objects
  steps JSONB,                                 -- array of strings
  nutrition JSONB,                             -- optional nutrition payload
  image_url TEXT,
  cost_estimate_cents INTEGER,                 -- precomputed estimate per recipe (total or per serving)
  servings INTEGER,
  popularity_score REAL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Functional indexes for fast filtering
CREATE INDEX IF NOT EXISTS meals_category_idx ON meals (category);
CREATE INDEX IF NOT EXISTS meals_cuisine_idx ON meals (cuisine);
CREATE INDEX IF NOT EXISTS meals_cooking_time_idx ON meals (cooking_time_minutes);
CREATE INDEX IF NOT EXISTS meals_source_source_id_idx ON meals (source, source_id);
CREATE INDEX IF NOT EXISTS meals_created_at_idx ON meals (created_at DESC);

-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Public read policy (catalog is non-sensitive; adjust if needed)
CREATE POLICY "Anyone can read meals" ON meals FOR SELECT USING (true);

-- Insert/update restricted to service role by default; add policies if you need client writes

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION set_meals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meals_updated_at ON meals;
CREATE TRIGGER trg_meals_updated_at
BEFORE UPDATE ON meals
FOR EACH ROW
EXECUTE FUNCTION set_meals_updated_at();


