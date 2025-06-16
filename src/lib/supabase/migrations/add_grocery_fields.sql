-- Add new columns to food_requests
ALTER TABLE food_requests
  ADD COLUMN section text,
  ADD COLUMN priority text DEFAULT 'normal',
  ADD COLUMN is_manual boolean DEFAULT false;

-- Add constraint for priority
ALTER TABLE food_requests
  ADD CONSTRAINT food_requests_priority_check 
  CHECK (priority IN ('normal', 'urgent'));

-- Add constraint for section
ALTER TABLE food_requests
  ADD CONSTRAINT food_requests_section_check 
  CHECK (section IN (
    'Produce',
    'Meat & Seafood',
    'Dairy & Eggs',
    'Bakery',
    'Pantry',
    'Frozen',
    'Beverages',
    'Household',
    'Other'
  )); 