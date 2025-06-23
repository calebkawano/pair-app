-- Add versioning to food requests for history tracking
ALTER TABLE food_requests
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN version_history JSONB[];

-- Add soft delete capability
ALTER TABLE food_requests
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by UUID REFERENCES profiles(id);

-- Add better categorization
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  icon TEXT,
  color TEXT,
  UNIQUE(name, parent_id)
);

-- Add item metadata
CREATE TABLE item_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  typical_unit TEXT,
  typical_quantity NUMERIC,
  nutritional_info JSONB,
  storage_tips TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(item_name)
);

-- Add price tracking
CREATE TABLE price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_name TEXT NOT NULL,
  store_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  unit TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  recorded_by UUID REFERENCES profiles(id),
  UNIQUE(item_name, store_name, recorded_at)
);

-- Add indexes for better performance
CREATE INDEX food_requests_version_idx ON food_requests(version);
CREATE INDEX food_requests_deleted_at_idx ON food_requests(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX categories_parent_id_idx ON categories(parent_id);
CREATE INDEX item_metadata_category_id_idx ON item_metadata(category_id);
CREATE INDEX price_history_item_store_idx ON price_history(item_name, store_name);
CREATE INDEX price_history_recorded_at_idx ON price_history(recorded_at);

-- Add RLS policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Categories can be viewed by all authenticated users
CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage categories
CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Item metadata can be viewed by all authenticated users
CREATE POLICY "item_metadata_select" ON item_metadata
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can manage item metadata
CREATE POLICY "item_metadata_insert" ON item_metadata
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "item_metadata_update" ON item_metadata
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Price history can be viewed by all authenticated users
CREATE POLICY "price_history_select" ON price_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Any authenticated user can add price history
CREATE POLICY "price_history_insert" ON price_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND recorded_by = auth.uid());

-- Add functions for version history
CREATE OR REPLACE FUNCTION update_food_request_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the old version in history
  NEW.version_history = array_append(
    COALESCE(OLD.version_history, ARRAY[]::jsonb[]),
    to_jsonb(OLD)
  );
  -- Increment version
  NEW.version = COALESCE(OLD.version, 1) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER food_request_version_trigger
  BEFORE UPDATE ON food_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_food_request_version();

-- Add function to get price trends
CREATE OR REPLACE FUNCTION get_price_trends(
  p_item_name TEXT,
  p_store_name TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  price_trend NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH prices AS (
    SELECT price
    FROM price_history
    WHERE item_name = p_item_name
    AND store_name = p_store_name
    AND recorded_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY recorded_at
  )
  SELECT
    AVG(price)::NUMERIC(10,2) as avg_price,
    MIN(price)::NUMERIC(10,2) as min_price,
    MAX(price)::NUMERIC(10,2) as max_price,
    (LAST_VALUE(price) OVER () - FIRST_VALUE(price) OVER ())::NUMERIC(10,2) as price_trend
  FROM prices;
END;
$$ LANGUAGE plpgsql; 