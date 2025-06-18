-- Add columns to persist grocery list state
ALTER TABLE food_requests 
ADD COLUMN IF NOT EXISTS is_purchased BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS food_requests_is_purchased_idx ON food_requests(is_purchased);
CREATE INDEX IF NOT EXISTS food_requests_is_accepted_idx ON food_requests(is_accepted);

-- Update existing approved items to be accepted
UPDATE food_requests 
SET is_accepted = true, 
    accepted_by = approved_by, 
    accepted_at = approved_at 
WHERE status = 'approved' AND is_accepted = false; 