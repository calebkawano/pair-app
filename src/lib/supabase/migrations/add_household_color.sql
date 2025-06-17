-- Add color column to households table
ALTER TABLE households 
ADD COLUMN IF NOT EXISTS color TEXT; 