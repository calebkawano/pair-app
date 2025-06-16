-- Make address column nullable
ALTER TABLE households
  ALTER COLUMN address DROP NOT NULL; 