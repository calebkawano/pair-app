-- Safe migration to fix section constraint
-- First, let's see what section values currently exist
-- (This is just for reference - you can run this query separately to see what's in your DB)
-- SELECT DISTINCT section FROM food_requests WHERE section IS NOT NULL;

-- Step 1: Drop the existing constraint FIRST (so we can update the data)
ALTER TABLE food_requests DROP CONSTRAINT IF EXISTS food_requests_section_check;

-- Step 2: Clean up existing data (now that constraint is gone)
-- Update any 'Meat & Seafood' entries to 'Meat'
UPDATE food_requests 
SET section = 'Meat' 
WHERE section = 'Meat & Seafood';

-- Handle any other invalid section values by setting them to 'Other'
-- This covers any edge cases or typos in existing data
UPDATE food_requests 
SET section = 'Other' 
WHERE section IS NOT NULL 
AND section NOT IN (
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
);

-- Step 3: Add the new constraint with separate Meat and Seafood
ALTER TABLE food_requests
  ADD CONSTRAINT food_requests_section_check 
  CHECK (section IS NULL OR section IN (
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