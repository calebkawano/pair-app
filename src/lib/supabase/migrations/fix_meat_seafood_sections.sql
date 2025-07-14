-- Fix section constraint to separate Meat and Seafood
-- Drop the existing constraint
ALTER TABLE food_requests DROP CONSTRAINT IF EXISTS food_requests_section_check;

-- Add the updated constraint with separate Meat and Seafood
ALTER TABLE food_requests
  ADD CONSTRAINT food_requests_section_check 
  CHECK (section IN (
    'Produce',
    'Meat',
    'Seafood',
    'Dairy & Eggs',
    'Bakery',
    'Pantry',
    'Frozen',
    'Beverages',
    'Household',
    'Other'
  ));

-- Update any existing 'Meat & Seafood' entries to 'Meat' (since we can't know which one they meant)
UPDATE food_requests 
SET section = 'Meat' 
WHERE section = 'Meat & Seafood'; 