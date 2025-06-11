-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS location_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS family_shopping_size INTEGER DEFAULT 1; 